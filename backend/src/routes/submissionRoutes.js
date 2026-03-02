import express from 'express';
import * as submissionController from '../controllers/submissionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/run', authenticate, submissionController.runCode);
router.post('/generate-followup', authenticate, submissionController.generateFollowUp);
router.post('/generate-hint', authenticate, submissionController.generateHint);
router.post('/submit-followup', authenticate, submissionController.submitFollowUp);
router.post('/code', authenticate, submissionController.submitCode);
router.post('/behavioral', authenticate, submissionController.submitBehavioral);
router.get('/:submissionId', authenticate, submissionController.getSubmission);
router.get('/interview/:interviewId', authenticate, submissionController.getInterviewSubmissions);

export default router;
