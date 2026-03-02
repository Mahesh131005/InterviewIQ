import express from 'express';
import * as companyController from '../controllers/companyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', companyController.getCompanies);
router.get('/:companyId', companyController.getCompanyById);
router.get('/:companyId/questions', companyController.getCompanyQuestions);

export default router;
