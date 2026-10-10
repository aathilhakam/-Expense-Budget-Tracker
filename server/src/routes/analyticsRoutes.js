import { Router } from 'express';
import { query } from 'express-validator';
import { analyticsOverview } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import { collectValidation, validateRequest } from '../middleware/validate.js';

const router = Router();
router.get(
  '/overview',
  requireAuth,
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  collectValidation,
  validateRequest,
  analyticsOverview,
);
export default router;
