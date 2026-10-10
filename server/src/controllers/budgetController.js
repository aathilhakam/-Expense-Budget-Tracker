import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fromMinorUnits, toMinorUnits } from '../utils/money.js';

async function budgetDtos(userId, filter = {}) {
  const budgets = await Budget.find({ userId, ...filter }).sort({ year: -1, month: -1, category: 1 });
  return Promise.all(
    budgets.map(async (budget) => {
      const start = new Date(Date.UTC(budget.year, budget.month - 1, 1));
      const end = new Date(Date.UTC(budget.year, budget.month, 1));
      const [spent] = await Transaction.aggregate([
        { $match: { userId, category: budget.category, type: 'expense', date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amountCents' } } },
      ]);
      const spentCents = spent?.total || 0;
      const percentage = budget.limitCents ? (spentCents / budget.limitCents) * 100 : 0;
      return {
        id: budget._id,
        category: budget.category,
        month: budget.month,
        year: budget.year,
        limit: fromMinorUnits(budget.limitCents),
        spent: fromMinorUnits(spentCents),
        remaining: fromMinorUnits(budget.limitCents - spentCents),
        percentage,
        overBudget: spentCents >= budget.limitCents,
      };
    }),
  );
}

export const listBudgets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.month) filter.month = Number(req.query.month);
  if (req.query.year) filter.year = Number(req.query.year);
  res.json({ budgets: await budgetDtos(req.user._id, filter) });
});

export const createBudget = asyncHandler(async (req, res) => {
  try {
    const budget = await Budget.create({
      userId: req.user._id,
      category: req.body.category,
      month: Number(req.body.month),
      year: Number(req.body.year),
      limitCents: toMinorUnits(req.body.limit),
    });
    const [dto] = await budgetDtos(req.user._id, { _id: budget._id });
    res.status(201).json({ budget: dto });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A budget for this category and month already exists.' });
    }
    throw error;
  }
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      category: req.body.category,
      month: Number(req.body.month),
      year: Number(req.body.year),
      limitCents: toMinorUnits(req.body.limit),
    },
    { new: true, runValidators: true },
  );
  if (!budget) return res.status(404).json({ message: 'Budget not found.' });
  const [dto] = await budgetDtos(req.user._id, { _id: budget._id });
  res.json({ budget: dto });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!budget) return res.status(404).json({ message: 'Budget not found.' });
  res.status(204).end();
});
