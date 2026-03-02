import { Company, Question } from '../models/index.js';

// Get all companies
export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    
    // Enrich with question count
    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        const totalQuestions = await Question.countByCompany(company.id);
        return {
          ...company,
          total_questions: totalQuestions,
        };
      })
    );

    res.json({
      companies: enrichedCompanies,
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

// Get single company details
export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get question distribution by difficulty
    const questions = await Question.findByCompany(companyId, 1000);
    const distribution = {
      easy: questions.filter((q) => q.difficulty === 'easy').length,
      medium: questions.filter((q) => q.difficulty === 'medium').length,
      hard: questions.filter((q) => q.difficulty === 'hard').length,
    };

    // Get common topics
    const topicMap = {};
    questions.forEach((q) => {
      topicMap[q.topic] = (topicMap[q.topic] || 0) + 1;
    });

    const commonTopics = Object.entries(topicMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      company: {
        ...company,
        question_distribution: distribution,
        common_topics: commonTopics,
        total_questions: questions.length,
      },
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

// Get questions for a company
export const getCompanyQuestions = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { difficulty, topic, limit = 20, offset = 0 } = req.query;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    let questions = await Question.findByCompany(companyId, 1000);

    // Filter by difficulty
    if (difficulty) {
      questions = questions.filter((q) => q.difficulty === difficulty);
    }

    // Filter by topic
    if (topic) {
      questions = questions.filter((q) => q.topic === topic);
    }

    // Paginate
    const paginatedQuestions = questions.slice(offset, offset + limit);

    res.json({
      company_id: companyId,
      total: questions.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      questions: paginatedQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        topic: q.topic,
        expected_complexity: q.expected_complexity,
      })),
    });
  } catch (error) {
    console.error('Get company questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Get question details
export const getQuestionDetail = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Get publicly visible test cases
    const testCases = await Question.findByQuestionPublic(
      questionId,
      false // Excludes hidden test cases
    );

    res.json({
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
      },
    });
  } catch (error) {
    console.error('Get question detail error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

export default {
  getCompanies,
  getCompanyById,
  getCompanyQuestions,
  getQuestionDetail,
};
