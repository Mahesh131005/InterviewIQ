import { PracticeProblem, PracticeTestcase, PracticeSubmission } from '../models/index.js';
import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://python-service:5001';

// Get list of practice problems with filtering/search
export const getProblems = async (req, res) => {
  try {
    const userId = req.userId;
    const { search, difficulty, topic, company, sort, page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const result = await PracticeProblem.search(userId, {
      query: search,
      difficulty,
      topic,
      company,
      sort,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      problems: result.problems,
      total: result.total,
      page: parseInt(page),
      totalPages: Math.ceil(result.total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get practice problems error:', error);
    res.status(500).json({ error: 'Failed to fetch practice problems' });
  }
};

// Get single practice problem details
export const getProblemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const problem = await PracticeProblem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Get visible testcases
    const testcases = await PracticeTestcase.findByProblem(id, false);
    
    res.json({
      problem: {
        ...problem,
        visible_testcases: testcases
      }
    });
  } catch (error) {
    console.error('Get practice problem details error:', error);
    res.status(500).json({ error: 'Failed to fetch problem details' });
  }
};

// Submit code for a practice problem
export const submitSolution = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;
    const userId = req.userId;
    
    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }
    
    const problem = await PracticeProblem.findById(id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    // Get ALL test cases (including hidden) for evaluation
    const testCases = await PracticeTestcase.findByProblem(id, true);
    
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this problem' });
    }
    
    // Call python microservice to execute code
    let executionResult;
    try {
      const response = await axios.post(`${PYTHON_SERVICE_URL}/execute-code`, {
        code,
        language,
        testCases: testCases.map(tc => ({
          id: tc.id,
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden
        }))
      });
      executionResult = response.data;
    } catch (error) {
      console.error('Execution service error:', error.message);
      return res.status(503).json({ error: 'Code execution service is unavailable' });
    }
    
    // Analyze results
    const passedCount = executionResult.passedTestcases || 0;
    const totalCount = executionResult.totalTestcases || testCases.length;
    const isAccepted = passedCount === totalCount && totalCount > 0;
    const status = isAccepted ? 'solved' : 'failed';
    
    const avgRuntime = executionResult.runtimeMs || 0;
    const avgMemory = executionResult.memoryMb || 0;
    
    // Record submission
    const submission = await PracticeSubmission.create(
      userId,
      id,
      status,
      code,
      language,
      avgRuntime,
      avgMemory
    );
    
    // Update problem stats
    await PracticeProblem.incrementAttempts(id, isAccepted);
    
    res.json({
      submission_id: submission.id,
      status,
      passed_testcases: passedCount,
      total_testcases: totalCount,
      runtime_ms: avgRuntime,
      memory_mb: avgMemory,
      error_message: executionResult.errorMessage || null,
      actual_output: executionResult.actualOutput || null
    });
  } catch (error) {
    console.error('Submit practice solution error:', error);
    res.status(500).json({ error: 'Failed to submit solution' });
  }
};

export default {
  getProblems,
  getProblemDetails,
  submitSolution
};
