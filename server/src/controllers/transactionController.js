import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fromMinorUnits, toMinorUnits } from '../utils/money.js';

export const transactionDto = (record) => ({
  id: record._id,
  type: record.type,
  amount: fromMinorUnits(record.amountCents),
  category: record.category,
  description: record.description,
  date: record.date.toISOString(),
  createdAt: record.createdAt,
});

function transactionFields(body) {
  return {
    type: body.type,
    amountCents: toMinorUnits(body.amount),
    category: body.category,
    description: body.description || '',
    date: new Date(`${body.date}T12:00:00.000Z`),
  };
}

export const listTransactions = asyncHandler(async (req, res) => {
  const query = { userId: req.user._id };
  if (['income', 'expense'].includes(req.query.type)) query.type = req.query.type;
  if (req.query.category) query.category = req.query.category;

  const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000Z`) : null;
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : null;
  if (from || to) query.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const min = req.query.minAmount !== undefined ? toMinorUnits(req.query.minAmount) : null;
  const max = req.query.maxAmount !== undefined ? toMinorUnits(req.query.maxAmount) : null;
  if (min !== null || max !== null) {
    query.amountCents = { ...(min !== null && { $gte: min }), ...(max !== null && { $lte: max }) };
  }

  const sortMap = {
    newest: { date: -1, createdAt: -1 },
    oldest: { date: 1, createdAt: 1 },
    highest: { amountCents: -1 },
    lowest: { amountCents: 1 },
  };
  const records = await Transaction.find(query).sort(sortMap[req.query.sort] || sortMap.newest).limit(500);
  const search = (req.query.search || '').trim().toLowerCase();
  const filtered = search
    ? records.filter((record) => `${record.category} ${record.description}`.toLowerCase().includes(search))
    : records;
  res.json({ transactions: filtered.map(transactionDto) });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const record = await Transaction.create({ ...transactionFields(req.body), userId: req.user._id });
  res.status(201).json({ transaction: transactionDto(record) });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const record = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
  if (!record) return res.status(404).json({ message: 'Transaction not found.' });
  res.json({ transaction: transactionDto(record) });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const record = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    transactionFields(req.body),
    { new: true, runValidators: true },
  );
  if (!record) return res.status(404).json({ message: 'Transaction not found.' });
  res.json({ transaction: transactionDto(record) });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const record = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!record) return res.status(404).json({ message: 'Transaction not found.' });
  res.status(204).end();
});
