import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fromMinorUnits } from '../utils/money.js';

export const analyticsOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month || now.getUTCMonth() + 1);
  const year = Number(req.query.year || now.getUTCFullYear());
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const match = { userId: req.user._id, date: { $gte: start, $lt: end } };
  const [byType, byCategory, trendRows] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amountCents' } } },
    ]),
    Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amountCents' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { userId: req.user._id, date: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) } } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amountCents' } } },
    ]),
  ]);
  const totalFor = (type) => byType.find((item) => item._id === type)?.total || 0;
  const trend = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, income: 0, expenses: 0 }));
  trendRows.forEach((row) => {
    trend[row._id.month - 1][row._id.type === 'income' ? 'income' : 'expenses'] = fromMinorUnits(row.total);
  });
  const income = totalFor('income');
  const expenses = totalFor('expense');

  res.json({
    month,
    year,
    totalIncome: fromMinorUnits(income),
    totalExpenses: fromMinorUnits(expenses),
    netBalance: fromMinorUnits(income - expenses),
    largestExpenseCategory: byCategory[0]?._id || null,
    categoryBreakdown: byCategory.map((row) => ({ category: row._id, amount: fromMinorUnits(row.total) })),
    monthlyTrend: trend,
  });
});
