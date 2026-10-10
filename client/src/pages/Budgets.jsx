import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2, Pencil, WalletCards } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import BudgetForm from '../components/budgets/BudgetForm.jsx';
import { createBudget, deleteBudget, getBudgets, updateBudget } from '../services/budgetService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/format.js';

export default function Budgets() {
  const { user } = useAuth();
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const monthName = useMemo(() => new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(period.year, period.month - 1, 1)), [period]);

  const load = async () => {
    setLoading(true);
    setError('');
    try { setBudgets(await getBudgets(period)); }
    catch (loadError) { setError(loadError.response?.data?.message || 'Could not load your budgets.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [period]);

  const save = async (payload) => {
    setSaving(true);
    try {
      if (selected) await updateBudget(selected.id, payload);
      else await createBudget(payload);
      setModal(false);
      setSelected(null);
      await load();
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      await deleteBudget(selected.id);
      setSelected(null);
      await load();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Could not delete budget.');
    } finally { setDeleteBusy(false); }
  };

  const totalLimit = budgets.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);

  return (
    <>
      <PageHeader title="Budgets" subtitle="Plan ahead and keep your monthly spending intentional." action={<button className="button button-primary" onClick={() => { setSelected(null); setModal(true); }}><Plus size={17} /> Create budget</button>} />
      {error ? <div className="error-banner" role="alert">{error}<button className="text-button" onClick={load}>Try again</button></div> : null}
      <section className="period-toolbar panel">
        <div><span className="eyebrow-label">BUDGET PERIOD</span><strong>{monthName} {period.year}</strong></div>
        <div className="period-controls">
          <select aria-label="Budget month" value={period.month} onChange={(event) => setPeriod({ ...period, month: Number(event.target.value) })}>
            {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2024, index, 1))}</option>)}
          </select>
          <input aria-label="Budget year" type="number" min="2000" max="2100" value={period.year} onChange={(event) => setPeriod({ ...period, year: Number(event.target.value) || now.getFullYear() })} />
        </div>
      </section>
      {loading ? <LoadingSpinner /> : budgets.length ? <>
        <section className="budget-summary-grid">
          <article className="panel budget-summary"><span>Total planned</span><strong>{formatCurrency(totalLimit, user?.preferredCurrency)}</strong><small>{budgets.length} category {budgets.length === 1 ? 'budget' : 'budgets'}</small></article>
          <article className="panel budget-summary"><span>Total spent</span><strong>{formatCurrency(totalSpent, user?.preferredCurrency)}</strong><small>{totalLimit > 0 ? `${Math.round((totalSpent / totalLimit) * 100)}% of your plan` : 'No limit set'}</small></article>
          <article className="panel budget-summary"><span>Remaining</span><strong className={totalLimit - totalSpent < 0 ? 'text-danger' : 'text-emerald'}>{formatCurrency(totalLimit - totalSpent, user?.preferredCurrency)}</strong><small>Across all categories</small></article>
        </section>
        <section className="budget-cards">
          {budgets.map((budget) => {
            const percentage = budget.percentage;
            const tone = percentage >= 100 ? 'danger' : percentage >= 70 ? 'warning' : 'good';
            return <article className="panel budget-card" key={budget.id}>
              <div className="budget-card-head"><span className="budget-icon"><WalletCards size={19} /></span><div className="row-actions">
                <button className="icon-action" aria-label={`Edit ${budget.category} budget`} onClick={() => { setSelected(budget); setModal(true); }}><Pencil size={16} /></button>
                <button className="icon-action icon-danger" aria-label={`Delete ${budget.category} budget`} onClick={() => setSelected({ ...budget, remove: true })}><Trash2 size={16} /></button>
              </div></div>
              <div className="budget-category-title"><h2>{budget.category}</h2>{percentage >= 100 ? <span className="overspend-badge"><AlertTriangle size={13} /> Over budget</span> : null}</div>
              <div className="budget-spent-amount"><strong>{formatCurrency(budget.spent, user?.preferredCurrency)}</strong><span>spent of {formatCurrency(budget.limit, user?.preferredCurrency)}</span></div>
              <div className="progress-track progress-large"><div className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div>
              <div className="budget-card-foot"><span>{Math.round(percentage)}% used</span><strong className={budget.remaining < 0 ? 'text-danger' : ''}>{formatCurrency(budget.remaining, user?.preferredCurrency)} {budget.remaining >= 0 ? 'remaining' : 'over'}</strong></div>
            </article>;
          })}
        </section>
      </> : <section className="panel"><EmptyState title="No budgets for this month" message="Create a category budget to track spending against your plan." action={<button className="button button-primary button-small" onClick={() => { setSelected(null); setModal(true); }}><Plus size={15} /> Create budget</button>} /></section>}
      <Modal open={modal} title={selected ? 'Edit budget' : 'Create budget'} onClose={() => { setModal(false); setSelected(null); }}>
        <BudgetForm initialValue={selected} onSubmit={save} onCancel={() => { setModal(false); setSelected(null); }} busy={saving} />
      </Modal>
      <ConfirmDialog open={Boolean(selected?.remove)} title="Delete budget?" message="The budget will be removed. Your transactions will not be affected." onCancel={() => setSelected(null)} onConfirm={remove} busy={deleteBusy} />
    </>
  );
}
