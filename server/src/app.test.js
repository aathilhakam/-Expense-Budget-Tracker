import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/finora_test';

const { default: mongoose } = await import('mongoose');
const { default: app } = await import('./app.js');
const firstAgent = request.agent(app);
const secondAgent = request.agent(app);
let firstUserId;
let firstTransactionId;
let firstBudgetId;

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.dropDatabase();
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('registers users and authenticates the account with an HttpOnly session cookie', async () => {
  const response = await firstAgent.post('/api/auth/register').send({
    name: 'Taylor Example',
    email: 'taylor@example.com',
    password: 'SecurePass123',
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, 'taylor@example.com');
  assert.equal(response.body.user.preferredCurrency, 'LKR');
  assert.match(response.headers['set-cookie'][0], /HttpOnly/i);
  firstUserId = response.body.user.id;

  const current = await firstAgent.get('/api/auth/me');
  assert.equal(current.status, 200);
  assert.equal(current.body.user.id, firstUserId);
});

test('rejects invalid registration and duplicate email', async () => {
  const invalid = await request(app).post('/api/auth/register').send({
    name: 'A',
    email: 'not-an-email',
    password: 'weak',
  });
  assert.equal(invalid.status, 400);

  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Taylor Example',
    email: 'taylor@example.com',
    password: 'SecurePass123',
  });
  assert.equal(duplicate.status, 409);
});

test('creates, filters, edits and deletes user-scoped transactions', async () => {
  const unauthorized = await request(app).get('/api/transactions');
  assert.equal(unauthorized.status, 401);

  const created = await firstAgent.post('/api/transactions').send({
    type: 'expense',
    amount: 1200.5,
    category: 'Food',
    description: 'Weekly groceries',
    date: '2026-10-05',
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.transaction.amount, 1200.5);
  firstTransactionId = created.body.transaction.id;

  const income = await firstAgent.post('/api/transactions').send({
    type: 'income',
    amount: 6500,
    category: 'Salary',
    description: 'October pay',
    date: '2026-10-01',
  });
  assert.equal(income.status, 201);

  const otherAccount = await secondAgent.post('/api/auth/register').send({
    name: 'Morgan Example',
    email: 'morgan@example.com',
    password: 'AnotherPass123',
  });
  assert.equal(otherAccount.status, 201);

  const hidden = await secondAgent.get(`/api/transactions/${firstTransactionId}`);
  assert.equal(hidden.status, 404);

  const filtered = await firstAgent.get('/api/transactions?type=expense&search=groceries&sort=highest');
  assert.equal(filtered.status, 200);
  assert.equal(filtered.body.transactions.length, 1);
  assert.equal(filtered.body.transactions[0].id, firstTransactionId);

  const updated = await firstAgent.put(`/api/transactions/${firstTransactionId}`).send({
    type: 'expense',
    amount: 1400.25,
    category: 'Food',
    description: 'Groceries and pantry',
    date: '2026-10-06',
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.transaction.amount, 1400.25);

  const crossAccountDelete = await secondAgent.delete(`/api/transactions/${firstTransactionId}`);
  assert.equal(crossAccountDelete.status, 404);
});

test('creates unique budgets and calculates spent, remaining, and dashboard totals', async () => {
  const created = await firstAgent.post('/api/budgets').send({
    category: 'Food',
    limit: 2000,
    month: 10,
    year: 2026,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.budget.spent, 1400.25);
  assert.equal(created.body.budget.remaining, 599.75);
  firstBudgetId = created.body.budget.id;

  const overspend = await firstAgent.post('/api/transactions').send({
    type: 'expense',
    amount: 800,
    category: 'Food',
    description: 'Extra groceries',
    date: '2026-10-07',
  });
  assert.equal(overspend.status, 201);

  const duplicate = await firstAgent.post('/api/budgets').send({
    category: 'Food',
    limit: 2500,
    month: 10,
    year: 2026,
  });
  assert.equal(duplicate.status, 409);

  const dashboard = await firstAgent.get('/api/dashboard/summary');
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.totalIncome, 6500);
  assert.equal(dashboard.body.totalExpenses, 2200.25);
  assert.equal(dashboard.body.balance, 4299.75);
  assert.equal(dashboard.body.budgets[0].overBudget, true);
  assert.equal(dashboard.body.budgets[0].exceededBy, 200.25);
  assert.equal(dashboard.body.budgets[0].percentage, 110.0125);

  const analytics = await firstAgent.get('/api/analytics/overview?month=10&year=2026');
  assert.equal(analytics.status, 200);
  assert.equal(analytics.body.largestExpenseCategory, 'Food');
  assert.equal(analytics.body.categoryBreakdown[0].amount, 2200.25);

  const profile = await firstAgent.put('/api/users/profile').send({
    name: 'Taylor Updated',
    preferredCurrency: 'USD',
  });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.user.preferredCurrency, 'USD');
});

test('deletes scoped transactions and budgets and logs out', async () => {
  const removedBudget = await firstAgent.delete(`/api/budgets/${firstBudgetId}`);
  assert.equal(removedBudget.status, 204);
  const hiddenBudget = await secondAgent.delete(`/api/budgets/${firstBudgetId}`);
  assert.equal(hiddenBudget.status, 404);

  const removedTransaction = await firstAgent.delete(`/api/transactions/${firstTransactionId}`);
  assert.equal(removedTransaction.status, 204);

  const loggedOut = await firstAgent.post('/api/auth/logout');
  assert.equal(loggedOut.status, 204);
  const afterLogout = await firstAgent.get('/api/auth/me');
  assert.equal(afterLogout.status, 401);
});
