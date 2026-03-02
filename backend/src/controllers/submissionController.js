import axios from 'axios';
import { Submission, Question, TestCase, Interview } from '../models/index.js';
import {
  calculateCorrectnessScore,
  calculateEfficiencyScore,
} from '../utils/helpers.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
const LLM_TIMEOUT = parseInt(process.env.PYTHON_SERVICE_TIMEOUT) || 30000;

// Run code against testcases without persisting
export const runCode = async (req, res) => {
  try {
    const { questionId, code, language, customInput } = req.body;

    if (!questionId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let testCasesToRun = [];

    // If user provided custom input, run that. Otherwise run default visible test cases.
    if (customInput !== undefined && customInput !== null) {
      let expectedOutput = '';
      const question = await Question.findById(questionId);
      if (question && question.reference_code) {
        try {
          // Note: using the same execute-code endpoint, the output of the reference code
          // for the custom input will be present in actualOutput
          const refRes = await axios.post(
            `${PYTHON_SERVICE_URL}/execute-code`,
            {
              code: question.reference_code,
              language: question.reference_language || 'python',
              testCases: [{ input: customInput, expectedOutput: '' }],
            },
            { timeout: LLM_TIMEOUT }
          );
          expectedOutput = refRes.data.actualOutput || '';
        } catch (e) {
          console.error('Failed to run reference solution:', e.message);
        }
      }
      // Populate testCasesToRun with the dynamically generated expectedOutput
      testCasesToRun = [{ input: customInput, expectedOutput: expectedOutput }];
    } else {
      const dbTestCases = await TestCase.findByQuestion(questionId, false);
      if (dbTestCases.length === 0) {
        return res.status(400).json({ error: 'No test cases found' });
      }
      testCasesToRun = dbTestCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expected_output,
      }));
    }

    try {
      const execRes = await axios.post(
        `${PYTHON_SERVICE_URL}/execute-code`,
        {
          code,
          language,
          testCases: testCasesToRun,
        },
        { timeout: LLM_TIMEOUT }
      );

      return res.json({
        message: 'Execution finished',
        execution: {
          passed_testcases: execRes.data.passedTestcases,
          total_testcases: execRes.data.totalTestcases,
          runtime_ms: execRes.data.runtimeMs,
          memory_mb: execRes.data.memoryMb,
          error: execRes.data.errorMessage,
          actual_output: execRes.data.actualOutput,
          expected_output: customInput !== undefined ? testCasesToRun[0]?.expectedOutput || '' : undefined,
        }
      });
    } catch (execError) {
      console.error('Code execution error from Python Service:', execError.response?.data || execError.message || execError);
      return res.status(500).json({
        error: execError.response?.data?.error || execError.message || 'Execution failed',
        details: execError.response?.data?.details || execError.response?.data?.error || execError.message
      });
    }
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({ error: error.message || 'Failed to run code' });
  }
};

// Submit code for a question
export const submitCode = async (req, res) => {
  try {
    const { interviewId, questionId, code, language, explanation = '' } =
      req.body;
    const userId = req.userId;

    // Validate input
    if (!interviewId || !questionId || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify interview exists and belongs to user
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    if (interview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get question and test cases
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const testCases = await TestCase.findByQuestion(questionId, true); // Include hidden
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found' });
    }

    // Execute code
    let executionResult = {
      passedTestcases: 0,
      totalTestcases: testCases.length,
      runtimeMs: null,
      memoryMb: null,
      errorMessage: null,
    };

    try {
      const codeExecResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/execute-code`,
        {
          code,
          language,
          testCases: testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expected_output,
          })),
        },
        { timeout: LLM_TIMEOUT }
      );

      executionResult = {
        passedTestcases: codeExecResponse.data.passedTestcases,
        totalTestcases: codeExecResponse.data.totalTestcases,
        runtimeMs: codeExecResponse.data.runtimeMs,
        memoryMb: codeExecResponse.data.memoryMb,
        errorMessage: codeExecResponse.data.errorMessage,
      };
    } catch (execError) {
      console.error('Code execution error:', execError.message);
      executionResult.errorMessage =
        execError.response?.data?.error || execError.message;
    }

    // Calculate correctness score
    const correctnessScore = calculateCorrectnessScore(
      executionResult.passedTestcases,
      executionResult.totalTestcases
    );

    // Analyze complexity
    let complexityResult = {
      predictedComplexity: 'Unknown',
      complexityGap: 'Unknown',
      efficiencyScore: 0.5,
    };

    try {
      const complexityResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/analyze-complexity`,
        { code, language },
        { timeout: LLM_TIMEOUT }
      );

      complexityResult = {
        predictedComplexity: complexityResponse.data.predicted_complexity,
        complexityGap: complexityResponse.data.complexity_gap,
        efficiencyScore: complexityResponse.data.efficiency_score,
      };
    } catch (complexError) {
      console.error('Complexity analysis error:', complexError.message);
      complexityResult.efficiencyScore = calculateEfficiencyScore(
        complexityResult.predictedComplexity,
        question.expected_complexity
      );
    }

    // Evaluate explanation with LLM
    let explanationResult = {
      clarity_score: 0.5,
      logic_score: 0.5,
      depth_score: 0.5,
      feedback: 'Explanation evaluation pending',
    };

    if (explanation) {
      try {
        const explainResponse = await axios.post(
          `${PYTHON_SERVICE_URL}/evaluate-explanation`,
          {
            code,
            question_description: question.description,
            user_explanation: explanation,
            language,
          },
          { timeout: LLM_TIMEOUT }
        );

        explanationResult = {
          clarity_score: explainResponse.data.clarity_score || 0.5,
          logic_score: explainResponse.data.logic_score || 0.5,
          depth_score: explainResponse.data.depth_score || 0.5,
          feedback:
            explainResponse.data.feedback || 'Evaluation complete',
        };
      } catch (explainError) {
        console.error('Explanation evaluation error:', explainError.message);
      }
    }

    const explanationScore =
      (explanationResult.clarity_score +
        explanationResult.logic_score +
        explanationResult.depth_score) /
      3;

    // Create submission record
    const submission = await Submission.create({
      interviewId,
      questionId,
      code,
      language,
      correctnessScore,
      efficiencyScore: complexityResult.efficiencyScore,
      explanation,
      explanationScore,
      behavioralScore: 0.5, // Placeholder - will be evaluated separately
      runtimeMs: executionResult.runtimeMs,
      memoryMb: executionResult.memoryMb,
      predictedComplexity: complexityResult.predictedComplexity,
      expectedComplexity: question.expected_complexity,
      passedTestcases: executionResult.passedTestcases,
      totalTestcases: executionResult.totalTestcases,
      errorMessage: executionResult.errorMessage,
    });

    // Determine ML adaptive difficulty for the *next* question based on this submission's performance
    try {
      if (executionResult.totalTestcases > 0) {
        const difficultyResponse = await axios.post(
          `${PYTHON_SERVICE_URL}/determine-next-difficulty`,
          {
            current_difficulty: question.difficulty,
            passed_testcases: executionResult.passedTestcases,
            total_testcases: executionResult.totalTestcases,
            runtime_ms: executionResult.runtimeMs || 1000,
            target_runtime_ms: 1000 // In a production app you'd map baseline runtimes loosely to the AST
          },
          { timeout: LLM_TIMEOUT }
        );

        if (difficultyResponse.data?.recommended_difficulty) {
          // Persist the recommendation back to the DB so the interview logic picks it up globally
          await Interview.update(interviewId, {
            recommended_difficulty: difficultyResponse.data.recommended_difficulty
          });
        }
      }
    } catch (difficultyErr) {
      console.error('Failed to parse ML adaptive difficulty scaling:', difficultyErr.message);
    }

    // Update interview progress
    await Interview.update(interviewId, {
      completed_questions: (interview.completed_questions || 0) + 1,
    });

    res.status(201).json({
      message: 'Code submitted successfully',
      submission: {
        id: submission.id,
        correctness_score: correctnessScore,
        efficiency_score: complexityResult.efficiencyScore,
        explanation_score: explanationScore,
        execution: {
          passed_testcases: executionResult.passedTestcases,
          total_testcases: executionResult.totalTestcases,
          runtime_ms: executionResult.runtimeMs,
          memory_mb: executionResult.memoryMb,
          error: executionResult.errorMessage,
        },
        complexity: {
          predicted: complexityResult.predictedComplexity,
          expected: question.expected_complexity,
          gap: complexityResult.complexityGap,
        },
        explanation: {
          clarity_score: explanationResult.clarity_score,
          logic_score: explanationResult.logic_score,
          depth_score: explanationResult.depth_score,
          feedback: explanationResult.feedback,
        },
      },
    });
  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({ error: 'Failed to submit code' });
  }
};

// Generate an AI follow-up question
export const generateFollowUp = async (req, res) => {
  try {
    const { submissionId, code, explanation } = req.body;
    if (!submissionId || !code) {
      return res.status(400).json({ error: 'Missing submission ID or code' });
    }

    try {
      // Fetch full context from the database to drive the Context-Aware ML Generation
      const submission = await Submission.findById(submissionId);
      if (!submission) return res.status(404).json({ error: 'Submission not found' });

      const question = await Question.findById(submission.question_id);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const gRes = await axios.post(
        `${PYTHON_SERVICE_URL}/generate-followup`,
        {
          code: code,
          language: submission.language,
          problem_title: question.title,
          problem_description: question.description
        },
        { timeout: LLM_TIMEOUT } // ML generation might take a few seconds
      );

      const questionText = gRes.data.follow_up_question || gRes.data.question || "Could you explain the algorithmic optimization approach for this solution?";
      return res.json({ question: questionText });
    } catch (e) {
      console.error('Failed to generate context-aware follow up from ML engine:', e.response?.data || e.message);
      // Fallback question if python ML service fails
      return res.json({ question: "Could you explain the algorithmic optimization approach for this solution?" });
    }
  } catch (err) {
    console.error('Follow-up generation error:', err);
    res.status(500).json({ error: 'Failed to generate follow-up' });
  }
};

// Generate an algorithmic hint for a candidate stuck during coding
export const generateHint = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'Missing question ID' });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    try {
      const gRes = await axios.post(
        `${PYTHON_SERVICE_URL}/generate-hint`,
        {
          code: code || '',
          language: language || 'python',
          problem_title: question.title,
          problem_description: question.description
        },
        { timeout: LLM_TIMEOUT }
      );
      return res.json({ hint: gRes.data.hint });
    } catch (e) {
      console.error('Failed to generate hint from ML engine:', e.response?.data || e.message);
      return res.json({ hint: "Review your logic and consider if you are using the optimal data structures." });
    }
  } catch (err) {
    console.error('Hint generation error:', err);
    res.status(500).json({ error: 'Failed to generate hint' });
  }
};

// Evaluate AI follow-up answer
export const submitFollowUp = async (req, res) => {
  try {
    const { submissionId, question, answer } = req.body;
    if (!submissionId || !question || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    let score = 0;
    let feedback = '';

    try {
      const evalRes = await axios.post(
        `${PYTHON_SERVICE_URL}/evaluate-followup`,
        { question, answer, code: submission.code },
        { timeout: LLM_TIMEOUT }
      );
      score = evalRes.data.score;
      feedback = evalRes.data.feedback;
    } catch (e) {
      console.error('Failed to eval follow up in python:', e.message);
      score = 50;
      feedback = "Answer received, but unable to evaluate properly at the moment.";
    }

    // Save score as follow_up_score - wait, our DB might not have this column
    // Let's store it by updating the `explanation` to include follow-up.
    // We can just append it to explanation.
    const combinedFeedback = `${submission.explanation || ''}\n\n[Follow-Up Question]: ${question}\n[Your Answer]: ${answer}\n[AI Feedback (${score} / 100)]: ${feedback}`;

    await Submission.update(submissionId, {
      explanation: combinedFeedback
    });

    res.json({ message: 'Follow-up submitted successfully' });

  } catch (err) {
    console.error('Submit follow up error:', err);
    res.status(500).json({ error: 'Failed to submit follow-up' });
  }
};

// Submit behavioral response
export const submitBehavioral = async (req, res) => {
  try {
    const { submissionId, response } = req.body;
    const userId = req.userId;

    if (!submissionId || !response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Evaluate behavioral response with LLM
    let behavioralResult = {
      behavioralScore: 0.5,
      feedback: 'Evaluation pending',
    };

    try {
      const behaviorResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/evaluate-behavior`,
        { behavioral_response: response },
        { timeout: LLM_TIMEOUT }
      );

      behavioralResult = {
        behavioralScore: behaviorResponse.data.behavioral_score || 0.5,
        feedback: behaviorResponse.data.feedback || 'Evaluation complete',
      };
    } catch (behaviorError) {
      console.error('Behavioral evaluation error:', behaviorError.message);
    }

    // Update submission with behavioral score
    const updatedSubmission = await Submission.update(submissionId, {
      behavioral_score: behavioralResult.behavioralScore,
      behavioral_note: response,
    });

    res.json({
      message: 'Behavioral response submitted',
      submission: {
        behavioral_score: behavioralResult.behavioralScore,
        feedback: behavioralResult.feedback,
      },
    });
  } catch (error) {
    console.error('Submit behavioral error:', error);
    res.status(500).json({ error: 'Failed to submit behavioral response' });
  }
};

// Get submission details
export const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({
      submission: {
        id: submission.id,
        code: submission.code,
        language: submission.language,
        correctness_score: submission.correctness_score,
        efficiency_score: submission.efficiency_score,
        explanation_score: submission.explanation_score,
        behavioral_score: submission.behavioral_score,
        runtime_ms: submission.runtime_ms,
        memory_mb: submission.memory_mb,
        passed_testcases: submission.passed_testcases,
        total_testcases: submission.total_testcases,
        created_at: submission.created_at,
      },
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// Get all submissions for an interview
export const getInterviewSubmissions = async (req, res) => {
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

    res.json({
      submissions: submissions.map((sub) => ({
        id: sub.id,
        question_id: sub.question_id,
        language: sub.language,
        correctness_score: sub.correctness_score,
        efficiency_score: sub.efficiency_score,
        explanation_score: sub.explanation_score,
        behavioral_score: sub.behavioral_score,
        passed_testcases: sub.passed_testcases,
        total_testcases: sub.total_testcases,
        created_at: sub.created_at,
      })),
    });
  } catch (error) {
    console.error('Get interview submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export default {
  runCode,
  submitCode,
  generateFollowUp,
  submitFollowUp,
  submitBehavioral,
  getSubmission,
  getInterviewSubmissions,
};
