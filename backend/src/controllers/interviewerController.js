import axios from 'axios';
import { InterviewerSession, Interview, Question, Company, Submission } from '../models/index.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
const LLM_TIMEOUT = parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 60000;

// POST /api/interviewer/session/start
export const startSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { interviewId, questionId, companyTrack } = req.body;

    if (!interviewId) {
      return res.status(400).json({ error: 'interviewId is required' });
    }

    // Verify interview belongs to user
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Resolve company track name
    let track = companyTrack;
    if (!track && interview.company_id) {
      const company = await Company.findById(interview.company_id);
      track = company?.name || 'Tech Company';
    }

    // Create session record
    const session = await InterviewerSession.create(
      userId,
      interviewId,
      questionId || null,
      track || 'Tech Company'
    );

    res.status(201).json({
      message: 'Interviewer session started',
      session: {
        id: session.id,
        company_track: session.company_track,
        started_at: session.started_at,
      }
    });
  } catch (error) {
    console.error('Start interviewer session error:', error);
    res.status(500).json({ error: 'Failed to start interviewer session' });
  }
};

// POST /api/interviewer/chat
export const chat = async (req, res) => {
  try {
    const { session_id, phase, user_message, context, code_submitted } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Forward to Python service
    try {
      const pyRes = await axios.post(
        `${PYTHON_SERVICE_URL}/interviewer/chat`,
        {
          session_id,
          phase: phase || 'intro',
          user_message: user_message || '',
          context: context || {},
          code_submitted: code_submitted || false,
        },
        { timeout: LLM_TIMEOUT }
      );

      return res.json(pyRes.data);
    } catch (pyError) {
      console.error('Python interviewer chat error:', pyError.response?.data || pyError.message);
      // Graceful fallback
      return res.json({
        interviewer_message: "I'm having a moment — could you repeat your last thought? Let's keep the conversation going.",
        phase: phase || 'intro',
        is_followup: false,
        end_session: false,
      });
    }
  } catch (error) {
    console.error('Interviewer chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};

// POST /api/interviewer/session/end
export const endSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Verify session exists and belongs to user
    const session = await InterviewerSession.findById(session_id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Call Python scoring endpoint
    let scores = {
      explanation_score: 50,
      behavioral_score: 50,
      explanation_feedback: 'Evaluation pending',
      behavioral_feedback: 'Evaluation pending',
    };

    try {
      const pyRes = await axios.post(
        `${PYTHON_SERVICE_URL}/interviewer/score`,
        {
          session_id: session_id,
          context: {
            company_track: session.company_track,
            question_title: 'Interview Problem', // Will be enriched from context
          }
        },
        { timeout: LLM_TIMEOUT }
      );
      scores = pyRes.data;
    } catch (pyError) {
      console.error('Python interviewer scoring error:', pyError.response?.data || pyError.message);
    }

    // Normalize scores to 0-1 for DB storage (Ollama returns 0-100)
    const explanationNorm = Math.min(1, Math.max(0, (scores.explanation_score || 50) / 100));
    const behavioralNorm = Math.min(1, Math.max(0, (scores.behavioral_score || 50) / 100));

    // Update session with scores and end time
    const updatedSession = await InterviewerSession.update(session_id, {
      explanation_score: explanationNorm,
      behavioral_score: behavioralNorm,
      explanation_feedback: scores.explanation_feedback || '',
      behavioral_feedback: scores.behavioral_feedback || '',
      ended_at: new Date().toISOString(),
    });

    // Try to update related submission scores if interview has submissions
    try {
      if (session.interview_id) {
        const submissions = await Submission.findByInterview(session.interview_id);
        if (submissions.length > 0) {
          const latestSub = submissions[submissions.length - 1];
          await Submission.update(latestSub.id, {
            explanation_score: explanationNorm,
            behavioral_score: behavioralNorm,
          });
        }
      }
    } catch (subErr) {
      console.error('Failed to update submission scores:', subErr.message);
    }

    res.json({
      message: 'Session ended and scored',
      scores: {
        explanation_score: scores.explanation_score,
        behavioral_score: scores.behavioral_score,
        explanation_feedback: scores.explanation_feedback,
        behavioral_feedback: scores.behavioral_feedback,
      }
    });
  } catch (error) {
    console.error('End interviewer session error:', error);
    res.status(500).json({ error: 'Failed to end interviewer session' });
  }
};

export default {
  startSession,
  chat,
  endSession,
};
