import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import { currentUser, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { collectValidation, validateRequest } from '../middleware/validate.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const emailRule = body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail();
const passwordRule = body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters.');

router.post(
  '/register',
  authLimiter,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.'),
  emailRule,
  passwordRule,
  body('password').matches(/[a-z]/).matches(/[A-Z]/).matches(/\d/).withMessage('Password must include lowercase, uppercase, and numeric characters.'),
  collectValidation,
  validateRequest,
  register,
);
router.post('/login', authLimiter, emailRule, body('password').isString().notEmpty(), collectValidation, validateRequest, login);
router.get('/me', requireAuth, currentUser);
router.post('/logout', logout);

export default router;
