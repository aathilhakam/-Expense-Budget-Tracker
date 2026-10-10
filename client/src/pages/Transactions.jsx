import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Field from '../components/common/Field.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Modal from '../components/common/Modal.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import { deleteTransaction, getTransactions, createTransaction, updateTransaction } from '../services/transactionService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories.js';
import { formatCurrency, formatDate } from '../utils/format.js';

const emptyFilters = { search: '', type: '', category: '', from: '', to: '', minAmount: '', maxAmount: '', sort: 'newest' };

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ ...emptyFilters, search: searchParams.get('search') || '' });
  const [activeFilters, setActiveFilters] = useState({ search: searchParams.get('search') || '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const categories = filters.type === 'income' ? INCOME_CATEGORIES : filters.type === 'expense' ? EXPENSE_CATEGORIES : [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];
  const uniqueCategories = useMemo(() => [...new Set(categories)].sort(), [categories]);

  const load = async (params = activeFilters) => {
    setLoading(true);
    setError('');
    try { setItems(await getTransactions(params)); }
    catch (loadError) { setError(loadError.response?.data?.message || 'Unable to load transactions.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(activeFilters); }, [activeFilters]);
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModal('form');
      setSearchParams((current) => { current.delete('new'); return current; }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const applyFilters = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    setActiveFilters(next);
  };

  const save = async (payload) => {
    setSaving(true);
    try {
      if (selected && modal === 'edit') await updateTransaction(selected.id, payload);
      else await createTransaction(payload);
      setModal('');
      setSelected(null);
      await load();
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteTransaction(selected.id);
      setModal('');
      setSelected(null);
      await load();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Could not delete transaction.');
    } finally { setDeleteBusy(false); }
  };

  return (
    <>
      <PageHeader title="Transactions" subtitle="A clear view of every dollar coming in and going out." action={<button className="button button-primary" onClick={() => { setSelected(null); setModal('form'); }}><Plus size={17} /> Add transaction</button>} />
      {error ? <div className="error-banner" role="alert">{error}<button className="text-button" onClick={() => load()}>Try again</button></div> : null}
      <form className="panel filters-panel" onSubmit={applyFilters}>
        <div className="filters-grid">
          <label className="search-field"><Search size={17} /><input aria-label="Search" placeholder="Search descriptions or categories" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
          <Field label="Type" as="select" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value, category: '' })}>
            <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </Field>
          <Field label="Category" as="select" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="">All categories</option>{uniqueCategories.map((category) => <option key={category}>{category}</option>)}
          </Field>
          <Field label="From" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
          <Field label="To" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
          <Field label="Min amount" type="number" min="0" step="0.01" placeholder="Any" value={filters.minAmount} onChange={(event) => setFilters({ ...filters, minAmount: event.target.value })} />
          <Field label="Max amount" type="number" min="0" step="0.01" placeholder="Any" value={filters.maxAmount} onChange={(event) => setFilters({ ...filters, maxAmount: event.target.value })} />
          <Field label="Sort by" as="select" value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}>
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option>
          </Field>
        </div>
        <div className="filter-actions"><button className="button button-secondary" type="button" onClick={() => { setFilters(emptyFilters); setActiveFilters({}); }}>Clear filters</button><button className="button button-primary" type="submit">Apply filters</button></div>
      </form>

      <section className="panel table-panel">
        <div className="panel-heading table-title"><div><h2>All transactions</h2><p>{items.length} {items.length === 1 ? 'record' : 'records'} found</p></div></div>
        {loading ? <LoadingSpinner /> : items.length ? <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Date</th><th>Transaction</th><th>Category</th><th>Type</th><th className="align-right">Amount</th><th className="align-right">Actions</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}>
            <td>{formatDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td><div className="table-transaction"><strong>{item.description || item.category}</strong><small>{item.description ? item.category : 'No description'}</small></div></td>
            <td><span className="category-chip">{item.category}</span></td>
            <td><span className={`type-pill ${item.type}`}>{item.type}</span></td>
            <td className={`align-right amount-cell money-${item.type}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount, user?.preferredCurrency)}</td>
            <td className="align-right"><div className="row-actions">
              <button className="icon-action" aria-label="View transaction" onClick={() => { setSelected(item); setModal('view'); }}><Eye size={17} /></button>
              <button className="icon-action" aria-label="Edit transaction" onClick={() => { setSelected(item); setModal('edit'); }}><Pencil size={16} /></button>
              <button className="icon-action icon-danger" aria-label="Delete transaction" onClick={() => { setSelected(item); setModal('delete'); }}><Trash2 size={16} /></button>
            </div></td>
          </tr>)}</tbody>
        </table></div> : <EmptyState title="No transactions found" message="Try adjusting your filters, or add a transaction to get started." action={<button className="button button-primary button-small" onClick={() => setModal('form')}>Add transaction</button>} />}
      </section>

      <Modal open={modal === 'form' || modal === 'edit'} title={modal === 'edit' ? 'Edit transaction' : 'Add transaction'} onClose={() => { setModal(''); setSelected(null); }}>
        <TransactionForm initialValue={modal === 'edit' ? selected : null} onSubmit={save} onCancel={() => { setModal(''); setSelected(null); }} busy={saving} />
      </Modal>
      <Modal open={modal === 'view'} title="Transaction details" onClose={() => { setModal(''); setSelected(null); }}>
        {selected ? <div className="detail-list">
          <div><span>Description</span><strong>{selected.description || '—'}</strong></div><div><span>Category</span><strong>{selected.category}</strong></div>
          <div><span>Type</span><strong className={`money-${selected.type}`}>{selected.type}</strong></div><div><span>Amount</span><strong>{formatCurrency(selected.amount, user?.preferredCurrency)}</strong></div>
          <div><span>Date</span><strong>{formatDate(selected.date)}</strong></div>
        </div> : null}
      </Modal>
      <ConfirmDialog open={modal === 'delete'} title="Delete transaction?" message="This transaction will be permanently removed and dashboard totals will update." onCancel={() => { setModal(''); setSelected(null); }} onConfirm={confirmDelete} busy={deleteBusy} />
    </>
  );
}
