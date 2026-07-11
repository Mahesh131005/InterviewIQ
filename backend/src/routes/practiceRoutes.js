import express from 'express';
import * as practiceController from '../controllers/practiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all practice problems with filtering
router.get('/', authenticate, practiceController.getProblems);

// Get single problem details
router.get('/:id', authenticate, practiceController.getProblemDetails);

// Submit code for a problem
router.post('/:id/submit', authenticate, practiceController.submitSolution);

export default router;
