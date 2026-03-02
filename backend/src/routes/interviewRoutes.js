import express from 'express';
import * as interviewController from '../controllers/interviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Interview management
router.post('/', authenticate, interviewController.startInterview);
router.get('/history', authenticate, interviewController.getInterviewHistory);
router.get('/:interviewId', authenticate, interviewController.getInterviewDetails);
router.get('/:interviewId/questions', authenticate, interviewController.getInterviewQuestions);
router.post('/:interviewId/complete', authenticate, interviewController.completeInterview);
router.get('/:interviewId/next-question', authenticate, interviewController.getNextQuestion);

export default router;
