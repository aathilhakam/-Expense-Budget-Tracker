import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, formatDate, monthLabel } from '../utils/format.js';
import PageHeader from '../components/common/PageHeader.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart.jsx';
import ExpenseCategoryChart from '../components/dashboard/ExpenseCategoryChart.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/analytics/overview', { params: { year: new Date().getFullYear() } }),
      ]);
      setSummary(dashboardResponse.data);
      setTrend(analyticsResponse.data.monthlyTrend.map((row) => ({ ...row, month: monthLabel(row.month) })));
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Could not load your dashboard. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addTransaction = async (payload) => {
    setSaving(true);
    try {
      await api.post('/transactions', payload);
      setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const currency = user?.preferredCurrency || 'LKR';
  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date());
  const spentBudgets = [...(summary?.budgets || [])].sort((left, right) => {
    const leftOver = left.spent > left.limit;
    const rightOver = right.spent > right.limit;
    return Number(rightOver) - Number(leftOver) || right.percentage - left.percentage;
  });

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={`Here’s your money snapshot for ${monthName}.`}
        action={<button className="button button-primary" onClick={() => setAdding(true)}><Plus size={17} /> Add transaction</button>}
      />
      {error ? <div className="error-banner" role="alert"><span>{error}</span><button className="text-button" onClick={load}>Try again</button></div> : null}
      {loading ? <LoadingSpinner /> : summary ? <>
        <section className="stats-grid" aria-label="Financial summary">
          <StatCard label="Total income" amount={formatCurrency(summary.totalIncome, currency)} detail="This month" icon={ArrowDownLeft} tone="income" />
          <StatCard label="Total expenses" amount={formatCurrency(summary.totalExpenses, currency)} detail="This month" icon={ArrowUpRight} tone="expense" />
          <StatCard label="Current balance" amount={formatCurrency(summary.balance, currency)} detail="Income minus expenses" icon={Wallet} tone="balance" />
          <StatCard label="Budget remaining" amount={formatCurrency(summary.budgetRemaining, currency)} detail={`${spentBudgets.length} active ${spentBudgets.length === 1 ? 'budget' : 'budgets'}`} icon={WalletCards} tone="budget" />
        </section>

        <section className="dashboard-charts">
          <article className="panel chart-panel">
            <div className="panel-heading"><div><h2>Income vs expenses</h2><p>Your monthly cash flow</p></div><span className="chart-year">{new Date().getFullYear()}</span></div>
            <div className="chart-keys"><span><i className="key-income" /> Income</span><span><i className="key-expense" /> Expenses</span></div>
            <IncomeExpenseChart data={trend} currency={currency} />
          </article>
          <article className="panel chart-panel">
            <div className="panel-heading"><div><h2>Spending by category</h2><p>Where your money goes this month</p></div></div>
            <ExpenseCategoryChart data={summary.categoryTotals} currency={currency} />
          </article>
        </section>

        <section className="dashboard-lower">
          <article className="panel">
            <div className="panel-heading"><div><h2>Monthly budgets</h2><p>Keep your spending on track</p></div><Link className="inline-link" to="/budgets">Manage budgets</Link></div>
            {spentBudgets.length ? <div className="budget-list">
              {spentBudgets.map((budget) => {
                const percentage = budget.percentage;
                const tone = percentage >= 100 ? 'danger' : percentage >= 70 ? 'warning' : 'good';
                const exceededBy = budget.spent - budget.limit;
                return <div className="budget-row" key={budget.id}>
                  <div className="budget-row-top"><span>{budget.category}</span><strong>{formatCurrency(budget.spent, currency)} <small>of {formatCurrency(budget.limit, currency)}</small></strong></div>
                  <div className="progress-track"><div className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div>
                  {exceededBy > 0
                    ? <span className="budget-alert">{budget.category} is over budget by {formatCurrency(exceededBy, currency)}</span>
                    : percentage >= 100
                      ? <span className="budget-alert">{budget.category} has reached its budget limit</span>
                      : <span className={percentage >= 70 ? 'budget-warning' : 'budget-left'}>{formatCurrency(budget.limit - budget.spent, currency)} left · {Math.round(percentage)}% used</span>}
                </div>;
              })}
            </div> : <EmptyState title="No budgets yet" message="Set a monthly limit to keep your spending on track." action={<Link className="button button-secondary button-small" to="/budgets">Create a budget</Link>} />}
          </article>
          <article className="panel">
            <div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest activity</p></div><Link className="inline-link" to="/transactions">View all</Link></div>
            {summary.recentTransactions.length ? <div className="recent-list">
              {summary.recentTransactions.map((transaction) => <div className="recent-item" key={transaction.id}>
                <span className={`transaction-mark ${transaction.type}`}>{transaction.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span>
                <span className="recent-copy"><strong>{transaction.description || transaction.category}</strong><small>{transaction.category} · {formatDate(transaction.date, { month: 'short', day: 'numeric' })}</small></span>
                <strong className={`money-${transaction.type}`}>{transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount, currency)}</strong>
              </div>)}
            </div> : <EmptyState title="No activity yet" message="Add your first transaction to see your financial activity here." action={<button className="button button-secondary button-small" onClick={() => navigate('/transactions?new=1')}>Add transaction</button>} />}
          </article>
        </section>
      </> : null}
      <Modal open={adding} title="Add transaction" onClose={() => setAdding(false)}>
        <TransactionForm onSubmit={addTransaction} onCancel={() => setAdding(false)} busy={saving} />
      </Modal>
    </>
  );
}
