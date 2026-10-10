import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fromMinorUnits } from '../utils/money.js';
import { transactionDto } from './transactionController.js';

export const dashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const match = { userId: req.user._id, date: { $gte: start, $lt: end } };
  const [totals, categoryRows, recentTransactions, budgets] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amountCents' } } },
    ]),
    Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amountCents' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 }).limit(5),
    Budget.find({ userId: req.user._id, month: now.getUTCMonth() + 1, year: now.getUTCFullYear() }),
  ]);
  const amountFor = (type) => totals.find((item) => item._id === type)?.total || 0;
  const [budgetSpending] = await Transaction.aggregate([
    {
      $match: {
        ...match,
        type: 'expense',
        category: { $in: budgets.map((budget) => budget.category) },
      },
    },
    { $group: { _id: '$category', total: { $sum: '$amountCents' } } },
  ]).then((rows) => [rows]);
  const spentByCategory = new Map((budgetSpending || []).map((row) => [row._id, row.total]));
  const budgetTotal = budgets.reduce((total, budget) => total + budget.limitCents, 0);
  const budgetSpent = budgets.reduce((total, budget) => total + (spentByCategory.get(budget.category) || 0), 0);
  const income = amountFor('income');
  const expenses = amountFor('expense');

  res.json({
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    totalIncome: fromMinorUnits(income),
    totalExpenses: fromMinorUnits(expenses),
    balance: fromMinorUnits(income - expenses),
    budgetRemaining: fromMinorUnits(budgetTotal - budgetSpent),
    categoryTotals: categoryRows.map((row) => ({ category: row._id, amount: fromMinorUnits(row.total) })),
    budgets: budgets.map((budget) => {
      const spent = spentByCategory.get(budget.category) || 0;
      return {
        id: budget._id,
        category: budget.category,
        limit: fromMinorUnits(budget.limitCents),
        spent: fromMinorUnits(spent),
        percentage: (spent / budget.limitCents) * 100,
        overBudget: spent > budget.limitCents,
        exceededBy: fromMinorUnits(Math.max(0, spent - budget.limitCents)),
      };
    }),
    recentTransactions: recentTransactions.map(transactionDto),
  });
});
