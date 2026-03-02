import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, analyticsController.getUserAnalytics);
router.get('/topic/:topic', authenticate, analyticsController.getTopicAnalytics);
router.get('/company/:companyId', authenticate, analyticsController.getCompanyAnalytics);
router.get('/comparison', authenticate, analyticsController.getPerformanceComparison);

export default router;
