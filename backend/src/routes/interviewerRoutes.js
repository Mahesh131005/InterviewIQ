import express from 'express';
import * as interviewerController from '../controllers/interviewerController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/session/start', authenticate, interviewerController.startSession);
router.post('/chat', authenticate, interviewerController.chat);
router.post('/session/end', authenticate, interviewerController.endSession);

export default router;
