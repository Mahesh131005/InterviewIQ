import {
  Interview,
  Question,
  TestCase,
  TopicPerformance,
  Submission,
  SessionHistory,
  CompanyPerformance,
} from '../models/index.js';
import {
  selectDifficultyByWeight,
  selectTopicByWeakness,
  calculateOverallScore,
  calculateConfidenceScore,
  calculateCorrectnessScore,
  calculateEfficiencyScore,
} from '../utils/helpers.js';

// Start a new interview
export const startInterview = async (req, res) => {
  try {
    const { companyId, topic } = req.body;
    const userId = req.userId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Create interview session (store explicit top priority topic temporarily in memory, or use a new DB field. For now, since Interview table might not have topic, we create the interview. We will find a way to pass topic to getNextQuestion).
    // An elegant way without altering schema is to pass the topic back to the client or assume the client will request the topic in getNextQuestion if we modify that endpoint. But we need it in `getNextQuestion` which doesn't accept body.
    // Let's modify the DB or just pass topic as a query param in getNextQuestion. Wait, we can't easily modify the DB schema now.
    // Instead, if the user explicitly wants a topic, they selected it. It's better to modify getNextQuestion to accept a `topic` query param.
    const interview = await Interview.create(userId, companyId, 3); // Default 3 questions

    res.status(201).json({
      message: 'Interview started',
      interview: {
        id: interview.id,
        company_id: interview.company_id,
        user_id: interview.user_id,
        status: interview.status,
        total_questions: interview.total_questions,
        completed_questions: interview.completed_questions,
        preferred_topic: topic || null // Pass back to client
      },
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

// Get next question for interview
export const getNextQuestion = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.userId;

    // Get interview
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({ error: 'Interview is not in progress' });
    }

    if (interview.completed_questions >= interview.total_questions) {
      return res.status(400).json({ error: 'All questions completed' });
    }

    // Get user's topic performance
    let topicPerformances = await TopicPerformance.findByUser(userId);
    if (topicPerformances.length === 0) {
      // First interview - use equal distribution
      topicPerformances = [];
    }

    // Get company difficulty bias
    const company = await Question.findByCompany(interview.company_id, 1);
    let difficultyBias = { easy: 33, medium: 33, hard: 34 }; // Default

    // Try to select explicitly requested topic (passed via query)
    const preferredTopic = req.query.topic;

    let question = null;
    let selectedTopic = null;

    if (preferredTopic) {
      selectedTopic = preferredTopic;
      question = await Question.findByTopicAndCompany(
        interview.company_id,
        selectedTopic
      );
      // Fallback: If company has no questions for this topic, pull from any company
      if (!question) {
        question = await Question.findByTopic(selectedTopic);
      }
    }

    // Try to select by weak topic if no preferred topic
    if (!question && topicPerformances.length > 0) {
      selectedTopic = selectTopicByWeakness(topicPerformances);
      if (selectedTopic) {
        question = await Question.findByTopicAndCompany(
          interview.company_id,
          selectedTopic
        );
        // Fallback: Pull from any company if weakness topic isn't in target company
        if (!question) {
          question = await Question.findByTopic(selectedTopic);
        }
      }
    }

    // If no question found by weak topic or preferred topic, select by difficulty
    if (!question) {
      let difficulty = selectDifficultyByWeight(difficultyBias);

      // Override with ML Adaptive Difficulty if set by previous submission
      if (interview.recommended_difficulty) {
        difficulty = interview.recommended_difficulty;
        // Clear it so it recalculates accurately on the next submit
        await Interview.update(interviewId, { recommended_difficulty: null });
      }

      question = await Question.findByDifficultyAndCompany(
        interview.company_id,
        difficulty
      );
    }

    // Strict Fallback: If STILL no question (e.g. company has no 'hard' questions but 'hard' was randomly picked)
    if (!question) {
      const fallbackQuestions = await Question.findByCompany(interview.company_id, 1);
      if (fallbackQuestions && fallbackQuestions.length > 0) {
        question = fallbackQuestions[0];
      }
    }

    if (!question) {
      return res.status(400).json({
        error: 'No more questions available for this company',
      });
    }

    // Get test cases (only visible ones)
    const testCases = await TestCase.findByQuestion(question.id, false);

    res.json({
      interview_id: interviewId,
      question_number: interview.completed_questions + 1,
      total_questions: interview.total_questions,
      question: {
        id: question.id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        expected_complexity: question.expected_complexity,
        topic: question.topic,
        constraints: question.constraints,
        sample_input: question.sample_input,
        sample_output: question.sample_output,
        hints: question.hints,
        input_format: question.input_format,
        output_format: question.output_format,
        visible_testcases: testCases.length,
      },
    });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
};

// Get all questions for an interview
export const getInterviewQuestions = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.userId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const submissions = await Submission.findByInterview(interviewId);

    const questions = await Promise.all(
      submissions.map(async (sub) => {
        const question = await Question.findById(sub.question_id);
        return {
          question_id: question.id,
          question_title: question.title,
          submitted_at: sub.created_at,
          correctness_score: sub.correctness_score,
          efficiency_score: sub.efficiency_score,
          explanation_score: sub.explanation_score,
          behavioral_score: sub.behavioral_score,
          passed_testcases: sub.passed_testcases,
          total_testcases: sub.total_testcases,
        };
      })
    );

    res.json({
      interview_id: interviewId,
      questions,
    });
  } catch (error) {
    console.error('Get interview questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get interview details
export const getInterviewDetails = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.userId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      interview: {
        id: interview.id,
        status: interview.status,
        overall_score: interview.overall_score,
        confidence_score: interview.confidence_score,
        completed_questions: interview.completed_questions,
        total_questions: interview.total_questions,
        created_at: interview.created_at,
        completed_at: interview.completed_at,
      },
    });
  } catch (error) {
    console.error('Get interview details error:', error);
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
};

// Get user's interview history
export const getInterviewHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const interviews = await Interview.findUserInterviews(
      userId,
      limit,
      offset
    );

    res.json({
      interviews,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get interview history error:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
};

// Complete interview and calculate scores
export const completeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const userId = req.userId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all submissions
    const submissions = await Submission.findByInterview(interviewId);

    if (submissions.length === 0) {
      return res.status(400).json({
        error: 'No submissions found for this interview',
      });
    }

    // Calculate scores
    const scores = {
      correctnessScore: 0,
      efficiencyScore: 0,
      explanationScore: 0,
      behavioralScore: 0,
    };

    submissions.forEach((sub) => {
      scores.correctnessScore += sub.correctness_score;
      scores.efficiencyScore += sub.efficiency_score;
      scores.explanationScore += sub.explanation_score;
      scores.behavioralScore += sub.behavioral_score;
    });

    // Average the scores
    const count = submissions.length;
    scores.correctnessScore /= count;
    scores.efficiencyScore /= count;
    scores.explanationScore /= count;
    scores.behavioralScore /= count;

    const overallScore = calculateOverallScore(scores);
    const confidenceScore = calculateConfidenceScore(scores);

    // Update interview
    await Interview.completeInterview(interviewId, overallScore, confidenceScore);

    // Update topic performance
    for (const sub of submissions) {
      const question = await Question.findById(sub.question_id);
      const existingTopic = await TopicPerformance.findByUserAndTopic(
        userId,
        question.topic
      );

      if (existingTopic) {
        const newTotal = existingTopic.total_attempts + 1;
        const newCorrect =
          existingTopic.correct_attempts +
          (sub.correctness_score > 0.8 ? 1 : 0);
        const newAvg = sub.correctness_score;

        await TopicPerformance.update(
          userId,
          question.topic,
          newAvg,
          newTotal,
          newCorrect
        );
      } else {
        await TopicPerformance.create(
          userId,
          question.topic,
          sub.correctness_score
        );
      }
    }

    // Update company performance
    await CompanyPerformance.upsert(
      userId,
      interview.company_id,
      overallScore
    );

    // Record session history
    await SessionHistory.create(userId, interviewId, overallScore);

    res.json({
      message: 'Interview completed',
      interview: {
        id: interviewId,
        overall_score: overallScore,
        confidence_score: confidenceScore,
        correctness_score: scores.correctnessScore,
        efficiency_score: scores.efficiencyScore,
        explanation_score: scores.explanationScore,
        behavioral_score: scores.behavioralScore,
      },
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: 'Failed to complete interview' });
  }
};

export default {
  startInterview,
  getNextQuestion,
  getInterviewQuestions,
  getInterviewDetails,
  getInterviewHistory,
  completeInterview,
};
