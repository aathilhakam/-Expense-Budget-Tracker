import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency, monthLabel } from '../utils/format.js';
import PageHeader from '../components/common/PageHeader.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

const PALETTE = ['#10B981', '#0F766E', '#34D399', '#6EE7B7', '#3B82F6', '#F59E0B', '#64748B', '#A78BFA'];

export default function Analytics() {
  const { user } = useAuth();
  const current = new Date();
  const [filter, setFilter] = useState({ month: current.getMonth() + 1, year: current.getFullYear() });
  const [draft, setDraft] = useState(filter);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currency = user?.preferredCurrency || 'LKR';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/analytics/overview', { params: filter })
      .then((response) => { if (!cancelled) setData(response.data); })
      .catch((loadError) => { if (!cancelled) setError(loadError.response?.data?.message || 'Unable to load analytics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filter]);

  const changeFilter = (event) => {
    event.preventDefault();
    setFilter({ month: Number(draft.month), year: Number(draft.year) });
  };
  const monthlyData = (data?.monthlyTrend || []).map((item) => ({ ...item, monthName: monthLabel(item.month) }));
  const hasData = data?.totalIncome > 0 || data?.totalExpenses > 0;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Understand patterns and make your next money move with confidence." />
      <form className="panel analytics-filter" onSubmit={changeFilter}>
        <div><span className="eyebrow-label">REPORT PERIOD</span><p>Choose a month and year for the summary.</p></div>
        <div className="analytics-filter-fields">
          <select aria-label="Analytics month" value={draft.month} onChange={(event) => setDraft({ ...draft, month: event.target.value })}>
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2024, index, 1))}</option>)}
          </select>
          <input aria-label="Analytics year" type="number" min="2000" max="2100" value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} />
          <button className="button button-primary" type="submit">Apply</button>
        </div>
      </form>
      {error ? <div className="error-banner" role="alert">{error}</div> : null}
      {loading ? <LoadingSpinner /> : data ? <>
        <section className="stats-grid analytics-stats">
          <article className="stat-card"><span className="stat-icon stat-income"><ArrowDownLeft size={19} /></span><span className="stat-label">Income</span><strong className="stat-amount">{formatCurrency(data.totalIncome, currency)}</strong><span className="stat-detail">{monthLabel(data.month)} {data.year}</span></article>
          <article className="stat-card"><span className="stat-icon stat-expense"><ArrowUpRight size={19} /></span><span className="stat-label">Expenses</span><strong className="stat-amount">{formatCurrency(data.totalExpenses, currency)}</strong><span className="stat-detail">{monthLabel(data.month)} {data.year}</span></article>
          <article className="stat-card"><span className="stat-icon stat-balance"><TrendingUp size={19} /></span><span className="stat-label">Net balance</span><strong className="stat-amount">{formatCurrency(data.netBalance, currency)}</strong><span className="stat-detail">Income minus expenses</span></article>
          <article className="stat-card"><span className="stat-icon stat-budget"><Activity size={19} /></span><span className="stat-label">Top expense category</span><strong className="stat-amount stat-category-value">{data.largestExpenseCategory || '—'}</strong><span className="stat-detail">By total spending</span></article>
        </section>
        {hasData ? <section className="analytics-grid">
          <article className="panel analytics-chart">
            <div className="panel-heading"><div><h2>Income vs expenses</h2><p>Monthly totals for {data.year}</p></div></div>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" /><XAxis dataKey="monthName" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} />
                <Tooltip formatter={(value) => formatCurrency(value, currency)} /><Bar dataKey="income" name="Income" fill="#10B981" radius={[5, 5, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>
          <article className="panel analytics-chart">
            <div className="panel-heading"><div><h2>Expense distribution</h2><p>Category mix for {monthLabel(data.month)}</p></div></div>
            {data.categoryBreakdown.length ? <div className="donut-layout analytics-donut">
              <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={data.categoryBreakdown} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={92} paddingAngle={3} stroke="none">{data.categoryBreakdown.map((item, index) => <Cell key={item.category} fill={PALETTE[index % PALETTE.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value, currency)} /></PieChart></ResponsiveContainer>
              <div className="legend-list">{data.categoryBreakdown.slice(0, 6).map((item, index) => <div className="legend-row" key={item.category}><span className="legend-label"><i style={{ background: PALETTE[index % PALETTE.length] }} />{item.category}</span><strong>{formatCurrency(item.amount, currency)}</strong></div>)}</div>
            </div> : <div className="chart-empty">No expense records for this period.</div>}
          </article>
          <article className="panel analytics-chart">
            <div className="panel-heading"><div><h2>Spending trend</h2><p>Expense movement across the year</p></div></div>
            <ResponsiveContainer width="100%" height={260}><LineChart data={monthlyData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="4 4" /><XAxis dataKey="monthName" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} /><Tooltip formatter={(value) => formatCurrency(value, currency)} /><Line dataKey="expenses" name="Expenses" type="monotone" stroke="#0F766E" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>
          </article>
          <article className="panel analytics-chart">
            <div className="panel-heading"><div><h2>Category comparison</h2><p>Expense totals by category</p></div></div>
            {data.categoryBreakdown.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={data.categoryBreakdown} layout="vertical" margin={{ top: 4, right: 15, left: 12, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="4 4" /><XAxis type="number" hide /><YAxis type="category" dataKey="category" width={88} tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} /><Tooltip formatter={(value) => formatCurrency(value, currency)} /><Bar dataKey="amount" name="Spent" fill="#10B981" radius={[0, 6, 6, 0]} barSize={17} /></BarChart></ResponsiveContainer> : <div className="chart-empty">No categories to compare yet.</div>}
          </article>
        </section> : <section className="panel"><EmptyState title="No analytics for this period" message="Once you add transactions for this month, your financial insights will appear here." /></section>}
      </> : null}
    </>
  );
}
