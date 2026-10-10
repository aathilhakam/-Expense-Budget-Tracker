import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { collectValidation, validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);
router.get('/profile', getProfile);
router.put(
  '/profile',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  body('preferredCurrency').isIn(['LKR', 'USD', 'EUR', 'GBP']).withMessage('Choose a supported currency.'),
  collectValidation,
  validateRequest,
  updateProfile,
);
export default router;
