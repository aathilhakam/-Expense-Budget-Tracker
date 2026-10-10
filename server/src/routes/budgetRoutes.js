import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { createBudget, deleteBudget, listBudgets, updateBudget } from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/auth.js';
import { collectValidation, validateRequest } from '../middleware/validate.js';

const router = Router();
const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Rent', 'Education', 'Healthcare', 'Entertainment', 'Travel', 'Other'];
const budgetValidation = [
  body('category').isIn(categories).withMessage('Choose a valid expense category.'),
  body('limit').isFloat({ gt: 0, max: 100000000 }).withMessage('Budget limit must be greater than zero.'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Choose a valid month.'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Choose a valid year.'),
];

router.use(requireAuth);
router.get(
  '/',
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  collectValidation,
  validateRequest,
  listBudgets,
);
router.post('/', ...budgetValidation, collectValidation, validateRequest, createBudget);
router.put('/:id', param('id').isMongoId(), ...budgetValidation, collectValidation, validateRequest, updateBudget);
router.delete('/:id', param('id').isMongoId(), collectValidation, validateRequest, deleteBudget);

export default router;
