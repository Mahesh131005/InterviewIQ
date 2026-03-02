import {
  TopicPerformance,
  CompanyPerformance,
  SessionHistory,
  Interview,
} from '../models/index.js';

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    // Get topic performance
    const topicPerformance = await TopicPerformance.findByUser(userId);

    // Get company performance
    const companyPerformance = await CompanyPerformance.findByUser(userId);

    // Get session history
    const sessionHistory = await SessionHistory.findByUser(userId, 100);

    // Calculate trends
    const recentSessions = sessionHistory.slice(0, 10);
    const trend =
      recentSessions.length >= 2
        ? recentSessions[0].score - recentSessions[recentSessions.length - 1].score
        : 0;

    // Get weak topics (lowest average score)
    const weakTopics = topicPerformance.slice(0, 5);

    // Calculate stats
    const avgScore =
      sessionHistory.length > 0
        ? sessionHistory.reduce((sum, s) => sum + s.score, 0) /
          sessionHistory.length
        : 0;

    const bestCompany = companyPerformance.length > 0
      ? companyPerformance.reduce((prev, current) =>
          prev.avg_score > current.avg_score ? prev : current
        )
      : null;

    const worstCompany = companyPerformance.length > 0
      ? companyPerformance.reduce((prev, current) =>
          prev.avg_score < current.avg_score ? prev : current
        )
      : null;

    res.json({
      analytics: {
        overall_stats: {
          total_interviews: sessionHistory.length,
          average_score: parseFloat(avgScore.toFixed(2)),
          trend: parseFloat(trend.toFixed(2)),
          best_company: bestCompany ? {
            name: bestCompany.company_name,
            score: bestCompany.avg_score,
          } : null,
          worst_company: worstCompany ? {
            name: worstCompany.company_name,
            score: worstCompany.avg_score,
          } : null,
        },
        topic_performance: topicPerformance.map((tp) => ({
          topic: tp.topic,
          avg_score: parseFloat(tp.avg_score.toFixed(2)),
          attempts: tp.total_attempts,
          correct: tp.correct_attempts,
          accuracy: tp.total_attempts > 0
            ? (tp.correct_attempts / tp.total_attempts * 100).toFixed(1) + '%'
            : '0%',
        })),
        weak_topics: weakTopics.map((tp) => ({
          topic: tp.topic,
          score: parseFloat(tp.avg_score.toFixed(2)),
          attempts: tp.total_attempts,
        })),
        company_performance: companyPerformance.map((cp) => ({
          company: cp.company_name,
          interviews: cp.total_interviews,
          avg_score: parseFloat(cp.avg_score.toFixed(2)),
          last_interview: cp.last_interview_at,
        })),
        score_history: sessionHistory.slice(0, 20).map((sh) => ({
          score: parseFloat(sh.score.toFixed(2)),
          timestamp: sh.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Get topic deep dive
export const getTopicAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { topic } = req.params;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const topicPerf = await TopicPerformance.findByUserAndTopic(userId, topic);

    if (!topicPerf) {
      return res.status(404).json({ error: 'No data found for this topic' });
    }

    res.json({
      topic_analytics: {
        topic: topic,
        average_score: parseFloat(topicPerf.avg_score.toFixed(2)),
        total_attempts: topicPerf.total_attempts,
        correct_attempts: topicPerf.correct_attempts,
        accuracy: topicPerf.total_attempts > 0
          ? ((topicPerf.correct_attempts / topicPerf.total_attempts) * 100).toFixed(1) + '%'
          : '0%',
        last_updated: topicPerf.last_updated,
      },
    });
  } catch (error) {
    console.error('Get topic analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch topic analytics' });
  }
};

// Get company deep dive
export const getCompanyAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const companyPerf = await CompanyPerformance.findByUserAndCompany(
      userId,
      companyId
    );

    if (!companyPerf) {
      return res
        .status(404)
        .json({ error: 'No interview data found for this company' });
    }

    // Get all interviews for this company
    const interviews = await Interview.findByUserAndCompany(
      userId,
      companyId,
      50
    );

    const scores = interviews.map((i) => i.overall_score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    res.json({
      company_analytics: {
        company_id: companyId,
        total_interviews: companyPerf.total_interviews,
        average_score: parseFloat(companyPerf.avg_score.toFixed(2)),
        best_score: parseFloat(maxScore.toFixed(2)),
        worst_score: parseFloat(minScore.toFixed(2)),
        last_interview: companyPerf.last_interview_at,
        interview_history: interviews.slice(0, 10).map((i) => ({
          id: i.id,
          score: parseFloat(i.overall_score.toFixed(2)),
          confidence: parseFloat(i.confidence_score.toFixed(2)),
          completed_questions: i.completed_questions,
          date: i.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get company analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch company analytics' });
  }
};

// Get performance comparison
export const getPerformanceComparison = async (req, res) => {
  try {
    const userId = req.userId;

    const topicPerformance = await TopicPerformance.findByUser(userId);
    const companyPerformance = await CompanyPerformance.findByUser(userId);

    // Group by difficulty implied from topics
    const topicsWithDifficulty = topicPerformance.map((tp) => ({
      topic: tp.topic,
      score: tp.avg_score,
    }));

    res.json({
      comparison: {
        by_topic: topicsWithDifficulty.sort((a, b) => b.score - a.score),
        by_company: companyPerformance
          .map((cp) => ({
            company: cp.company_name,
            score: cp.avg_score,
            interviews: cp.total_interviews,
          }))
          .sort((a, b) => b.score - a.score),
      },
    });
  } catch (error) {
    console.error('Get performance comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
};

export default {
  getUserAnalytics,
  getTopicAnalytics,
  getCompanyAnalytics,
  getPerformanceComparison,
};
