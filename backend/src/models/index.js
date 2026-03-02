import pool from '../db.js';

// User Model
export const User = {
  create: async (name, email, passwordHash) => {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, passwordHash]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },
};

// Company Model
export const Company = {
  findAll: async () => {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByName: async (name) => {
    const result = await pool.query('SELECT * FROM companies WHERE name = $1', [name]);
    return result.rows[0];
  },

  create: async (name, difficultyBias, description) => {
    const result = await pool.query(
      'INSERT INTO companies (name, difficulty_bias, description) VALUES ($1, $2, $3) RETURNING *',
      [name, JSON.stringify(difficultyBias), description]
    );
    return result.rows[0];
  },
};

// Question Model
export const Question = {
  create: async (title, description, difficulty, expectedComplexity, topic, companyId, constraints, sampleInput, sampleOutput, hints = {}, inputFormat = '', outputFormat = '', referenceCode = '', referenceLanguage = 'python') => {
    const result = await pool.query(
      `INSERT INTO questions 
       (title, description, difficulty, expected_complexity, topic, company_id, constraints, sample_input, sample_output, hints, input_format, output_format, reference_code, reference_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [title, description, difficulty, expectedComplexity, topic, companyId, constraints, sampleInput, sampleOutput, JSON.stringify(hints), inputFormat, outputFormat, referenceCode, referenceLanguage]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByCompany: async (companyId, limit = 20, offset = 0) => {
    const result = await pool.query(
      'SELECT * FROM questions WHERE company_id = $1 ORDER BY difficulty, created_at LIMIT $2 OFFSET $3',
      [companyId, limit, offset]
    );
    return result.rows;
  },

  findByDifficultyAndCompany: async (companyId, difficulty) => {
    const result = await pool.query(
      'SELECT * FROM questions WHERE company_id = $1 AND difficulty = $2 ORDER BY RANDOM() LIMIT 1',
      [companyId, difficulty]
    );
    return result.rows[0];
  },

  findByTopicAndCompany: async (companyId, topic) => {
    const result = await pool.query(
      'SELECT * FROM questions WHERE company_id = $1 AND topic ILIKE $2 ORDER BY RANDOM() LIMIT 1',
      [companyId, `%${topic}%`]
    );
    return result.rows[0];
  },

  findByTopic: async (topic) => {
    const result = await pool.query(
      'SELECT * FROM questions WHERE topic ILIKE $1 ORDER BY RANDOM() LIMIT 1',
      [`%${topic}%`]
    );
    return result.rows[0];
  },

  countByCompany: async (companyId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM questions WHERE company_id = $1',
      [companyId]
    );
    return parseInt(result.rows[0].count);
  },
};

// TestCase Model
export const TestCase = {
  create: async (questionId, input, expectedOutput, isHidden = false) => {
    const result = await pool.query(
      'INSERT INTO testcases (question_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, $4) RETURNING *',
      [questionId, input, expectedOutput, isHidden]
    );
    return result.rows[0];
  },

  findByQuestion: async (questionId, includeHidden = false) => {
    const query = includeHidden
      ? 'SELECT * FROM testcases WHERE question_id = $1 ORDER BY created_at'
      : 'SELECT * FROM testcases WHERE question_id = $1 AND is_hidden = FALSE ORDER BY created_at';

    const result = await pool.query(query, [questionId]);
    return result.rows;
  },

  countByQuestion: async (questionId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM testcases WHERE question_id = $1',
      [questionId]
    );
    return parseInt(result.rows[0].count);
  },
};

// Interview Model
export const Interview = {
  create: async (userId, companyId, totalQuestions = 3) => {
    const result = await pool.query(
      `INSERT INTO interviews (user_id, company_id, total_questions, status)
       VALUES ($1, $2, $3, 'in_progress')
       RETURNING *`,
      [userId, companyId, totalQuestions]
    );
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM interviews WHERE id = $1', [id]);
    return result.rows[0];
  },

  findByUserAndCompany: async (userId, companyId, limit = 10) => {
    const result = await pool.query(
      `SELECT * FROM interviews 
       WHERE user_id = $1 AND company_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3`,
      [userId, companyId, limit]
    );
    return result.rows;
  },

  findUserInterviews: async (userId, limit = 20, offset = 0) => {
    const result = await pool.query(
      `SELECT 
         i.*, 
         c.name as company_name,
         (
           SELECT json_agg(json_build_object(
             'title', q.title, 
             'difficulty', q.difficulty,
             'topic', q.topic
           ))
           FROM submissions s
           JOIN questions q ON s.question_id = q.id
           WHERE s.interview_id = i.id
         ) as questions_list
       FROM interviews i
       JOIN companies c ON i.company_id = c.id
       WHERE i.user_id = $1 
       ORDER BY i.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE interviews SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },

  completeInterview: async (id, overallScore, confidenceScore) => {
    const result = await pool.query(
      `UPDATE interviews 
       SET status = 'completed', overall_score = $1, confidence_score = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [overallScore, confidenceScore, id]
    );
    return result.rows[0];
  },
};

// Submission Model
export const Submission = {
  create: async (submissionData) => {
    const {
      interviewId,
      questionId,
      code,
      language,
      correctnessScore = 0,
      efficiencyScore = 0,
      explanation = '',
      explanationScore = 0,
      behavioralNote = '',
      behavioralScore = 0,
      runtimeMs = null,
      memoryMb = null,
      predictedComplexity = '',
      expectedComplexity = '',
      passedTestcases = 0,
      totalTestcases = 0,
      errorMessage = null,
    } = submissionData;

    const result = await pool.query(
      `INSERT INTO submissions 
       (interview_id, question_id, code, language, correctness_score, efficiency_score, 
        explanation, explanation_score, behavioral_note, behavioral_score, runtime_ms, memory_mb,
        predicted_complexity, expected_complexity, passed_testcases, total_testcases, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        interviewId, questionId, code, language, correctnessScore, efficiencyScore,
        explanation, explanationScore, behavioralNote, behavioralScore, runtimeMs, memoryMb,
        predictedComplexity, expectedComplexity, passedTestcases, totalTestcases, errorMessage,
      ]
    );
    return result.rows[0];
  },

  findByInterview: async (interviewId) => {
    const result = await pool.query(
      'SELECT * FROM submissions WHERE interview_id = $1 ORDER BY created_at',
      [interviewId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    return result.rows[0];
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE submissions SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },
};

// Topic Performance Model
export const TopicPerformance = {
  create: async (userId, topic, avgScore = 0) => {
    const result = await pool.query(
      `INSERT INTO topic_performance (user_id, topic, avg_score) VALUES ($1, $2, $3) RETURNING *`,
      [userId, topic, avgScore]
    );
    return result.rows[0];
  },

  findByUser: async (userId) => {
    const result = await pool.query(
      'SELECT * FROM topic_performance WHERE user_id = $1 ORDER BY avg_score ASC',
      [userId]
    );
    return result.rows;
  },

  findByUserAndTopic: async (userId, topic) => {
    const result = await pool.query(
      'SELECT * FROM topic_performance WHERE user_id = $1 AND topic = $2',
      [userId, topic]
    );
    return result.rows[0];
  },

  update: async (userId, topic, avgScore, totalAttempts, correctAttempts) => {
    const result = await pool.query(
      `UPDATE topic_performance 
       SET avg_score = $1, total_attempts = $2, correct_attempts = $3, last_updated = CURRENT_TIMESTAMP
       WHERE user_id = $4 AND topic = $5
       RETURNING *`,
      [avgScore, totalAttempts, correctAttempts, userId, topic]
    );
    return result.rows[0];
  },

  upsert: async (userId, topic, avgScore, totalAttempts, correctAttempts) => {
    const result = await pool.query(
      `INSERT INTO topic_performance (user_id, topic, avg_score, total_attempts, correct_attempts)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, topic) 
       DO UPDATE SET avg_score = $3, total_attempts = $4, correct_attempts = $5, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, topic, avgScore, totalAttempts, correctAttempts]
    );
    return result.rows[0];
  },
};

// Company Performance Model
export const CompanyPerformance = {
  findByUserAndCompany: async (userId, companyId) => {
    const result = await pool.query(
      'SELECT * FROM company_performance WHERE user_id = $1 AND company_id = $2',
      [userId, companyId]
    );
    return result.rows[0];
  },

  findByUser: async (userId) => {
    const result = await pool.query(
      `SELECT cp.*, c.name as company_name FROM company_performance cp
       JOIN companies c ON cp.company_id = c.id
       WHERE cp.user_id = $1 
       ORDER BY cp.last_updated DESC`,
      [userId]
    );
    return result.rows;
  },

  upsert: async (userId, companyId, avgScore) => {
    const result = await pool.query(
      `INSERT INTO company_performance (user_id, company_id, total_interviews, avg_score, last_interview_at)
       VALUES ($1, $2, 1, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, company_id)
       DO UPDATE SET total_interviews = company_performance.total_interviews + 1, avg_score = $3, last_interview_at = CURRENT_TIMESTAMP, last_updated = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, companyId, avgScore]
    );
    return result.rows[0];
  },
};

// Session History Model
export const SessionHistory = {
  create: async (userId, interviewId, score) => {
    const result = await pool.query(
      'INSERT INTO session_history (user_id, interview_id, score) VALUES ($1, $2, $3) RETURNING *',
      [userId, interviewId, score]
    );
    return result.rows[0];
  },

  findByUser: async (userId, limit = 50) => {
    const result = await pool.query(
      'SELECT * FROM session_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  },
};

export default {
  User,
  Company,
  Question,
  TestCase,
  Interview,
  Submission,
  TopicPerformance,
  CompanyPerformance,
  SessionHistory,
};
