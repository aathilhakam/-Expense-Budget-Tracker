import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';
import { collectValidation, validateRequest } from '../middleware/validate.js';

const router = Router();
const categories = {
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gifts', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Rent', 'Education', 'Healthcare', 'Entertainment', 'Travel', 'Other'],
};
const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Choose income or expense.'),
  body('amount').isFloat({ gt: 0, max: 100000000 }).withMessage('Amount must be greater than zero.'),
  body('category').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Choose a category.'),
  body('date').isISO8601({ strict: true }).withMessage('Enter a valid date.'),
  body('description').optional({ values: 'falsy' }).isString().isLength({ max: 160 }).withMessage('Description must be 160 characters or fewer.'),
];
const checkCategoryForType = (req, res, next) => {
  if (!categories[req.body.type]?.includes(req.body.category)) {
    return res.status(400).json({ message: 'That category is not valid for the selected transaction type.' });
  }
  next();
};

router.use(requireAuth);
router.get(
  '/',
  query('type').optional().isIn(['income', 'expense']),
  query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest']),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  collectValidation,
  validateRequest,
  listTransactions,
);
router.post('/', ...transactionValidation, collectValidation, validateRequest, checkCategoryForType, createTransaction);
router.get('/:id', param('id').isMongoId(), collectValidation, validateRequest, getTransaction);
router.put('/:id', param('id').isMongoId(), ...transactionValidation, collectValidation, validateRequest, checkCategoryForType, updateTransaction);
router.delete('/:id', param('id').isMongoId(), collectValidation, validateRequest, deleteTransaction);

export default router;
