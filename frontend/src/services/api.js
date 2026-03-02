import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  register: (name, email, password, confirmPassword) =>
    api.post('/auth/register', { name, email, password, confirmPassword }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Company endpoints
export const companies = {
  getAll: () => api.get('/companies'),
  getById: (companyId) => api.get(`/companies/${companyId}`),
  getQuestions: (companyId, params) =>
    api.get(`/companies/${companyId}/questions`, { params }),
};

// Interview endpoints
export const interviews = {
  start: (companyId, topic = '') =>
    api.post('/interviews', { companyId, topic }),
  getDetails: (interviewId) =>
    api.get(`/interviews/${interviewId}`),
  getNextQuestion: (interviewId, topic = '') =>
    api.get(`/interviews/${interviewId}/next-question`, { params: { topic } }),
  getQuestions: (interviewId) =>
    api.get(`/interviews/${interviewId}/questions`),
  getHistory: (limit = 20, offset = 0) =>
    api.get('/interviews/history', { params: { limit, offset } }),
  complete: (interviewId) =>
    api.post(`/interviews/${interviewId}/complete`),
};

// Submission endpoints
export const submissions = {
  runCode: (questionId, code, language, customInput) =>
    api.post('/submissions/run', { questionId, code, language, customInput }),
  submitCode: (interviewId, questionId, code, language, explanation = '') =>
    api.post('/submissions/code', {
      interviewId,
      questionId,
      code,
      language,
      explanation
    }),
  submitBehavioral: (submissionId, response) =>
    api.post('/submissions/behavioral', { submissionId, response }),
  generateFollowUp: (submissionId, code, explanation) =>
    api.post('/submissions/generate-followup', { submissionId, code, explanation }),
  generateHint: (questionId, code, language) =>
    api.post('/submissions/generate-hint', { questionId, code, language }),
  submitFollowUp: (submissionId, question, answer) =>
    api.post('/submissions/submit-followup', { submissionId, question, answer }),
  getSubmission: (submissionId) =>
    api.get(`/submissions/${submissionId}`),
  getInterviewSubmissions: (interviewId) =>
    api.get(`/submissions/interview/${interviewId}`),
};

// Analytics endpoints
export const analytics = {
  getUserAnalytics: (days = 30) =>
    api.get('/analytics/dashboard', { params: { days } }),
  getTopicAnalytics: (topic) =>
    api.get(`/analytics/topic/${topic}`),
  getCompanyAnalytics: (companyId) =>
    api.get(`/analytics/company/${companyId}`),
  getComparison: () =>
    api.get('/analytics/comparison'),
};

// Utility function for error handling
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data.error || 'An error occurred';
  } else if (error.request) {
    return 'No response from server';
  } else {
    return error.message;
  }
};

// Health check
export const health = () => api.get('/health');

export default api;
