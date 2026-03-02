import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Password hashing
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// JWT token generation
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
  } catch (error) {
    return null;
  }
};

// Scoring calculation
export const calculateOverallScore = (scores) => {
  const {
    correctnessScore = 0,
    efficiencyScore = 0,
    explanationScore = 0,
    behavioralScore = 0,
  } = scores;

  return (
    0.4 * correctnessScore +
    0.2 * efficiencyScore +
    0.2 * explanationScore +
    0.2 * behavioralScore
  );
};

// Sigmoid function for confidence score
export const sigmoid = (x) => {
  return 1 / (1 + Math.exp(-x));
};

// Calculate confidence score from score variance
export const calculateConfidenceScore = (scores) => {
  const values = Object.values(scores);
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Normalize std dev to 0-1 and apply sigmoid
  const normalizedVariance = Math.min(stdDev / 0.3, 1);
  return sigmoid(2 * normalizedVariance - 2);
};

// Adaptive difficulty logic
export const getAdaptiveDifficulty = (avgScore, userWideTopics = []) => {
  if (avgScore > 0.8) return 'hard';
  if (avgScore > 0.6) return 'medium';
  return 'easy';
};

// Weighted random selection for question difficulty
export const selectDifficultyByWeight = (difficultyBias) => {
  const { easy = 0, medium = 0, hard = 0 } = difficultyBias;
  const total = easy + medium + hard;
  const random = Math.random() * total;

  if (random < easy) return 'easy';
  if (random < easy + medium) return 'medium';
  return 'hard';
};

// Topic weighted selection for weak topics
export const selectTopicByWeakness = (topicPerformances) => {
  if (!topicPerformances || topicPerformances.length === 0) {
    return null;
  }

  // Sort by lowest score first (weakest topics)
  const sorted = topicPerformances
    .sort((a, b) => a.avg_score - b.avg_score)
    .slice(0, 5); // Consider top 5 weakest

  // Inverse scoring: lower score = higher weight
  const maxScore = sorted[sorted.length - 1].avg_score + 0.1;
  const weights = sorted.map((t) => maxScore - t.avg_score);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const random = Math.random() * totalWeight;
  let cumulative = 0;

  for (let i = 0; i < sorted.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return sorted[i].topic;
    }
  }

  return sorted[0].topic;
};

// Parse complexity from string like "O(n log n)"
export const parseComplexity = (complexityStr) => {
  if (!complexityStr) return null;

  const complexityMap = {
    'O(1)': 1,
    'O(log n)': 2,
    'O(n)': 3,
    'O(n log n)': 4,
    'O(n^2)': 5,
    'O(n^3)': 6,
    'O(2^n)': 7,
    'O(n!)': 8,
  };

  return complexityMap[complexityStr] || null;
};

// Calculate efficiency score based on complexity comparison
export const calculateEfficiencyScore = (predicted, expected) => {
  const predictedVal = parseComplexity(predicted);
  const expectedVal = parseComplexity(expected);

  if (!predictedVal || !expectedVal) return 0.5; // Default neutral score

  if (predictedVal === expectedVal) return 1.0;
  if (predictedVal < expectedVal) return 1.0; // Better than expected
  if (predictedVal === expectedVal + 1) return 0.7; // 1 level worse
  if (predictedVal === expectedVal + 2) return 0.4; // 2 levels worse
  return 0.2; // 3+ levels worse
};

// Calculate correctness score
export const calculateCorrectnessScore = (passedTestcases, totalTestcases) => {
  if (totalTestcases === 0) return 0;
  return passedTestcases / totalTestcases;
};

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  calculateOverallScore,
  sigmoid,
  calculateConfidenceScore,
  getAdaptiveDifficulty,
  selectDifficultyByWeight,
  selectTopicByWeakness,
  parseComplexity,
  calculateEfficiencyScore,
  calculateCorrectnessScore,
};
