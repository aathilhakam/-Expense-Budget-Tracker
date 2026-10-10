import { useState } from 'react';
import Field from '../common/Field.jsx';
import { EXPENSE_CATEGORIES } from '../../utils/categories.js';

const current = new Date();

export default function BudgetForm({ initialValue, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(initialValue || {
    category: 'Food',
    limit: '',
    month: current.getMonth() + 1,
    year: current.getFullYear(),
  });
  const [error, setError] = useState('');
  const set = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!(Number(form.limit) > 0)) return setError('Enter a monthly limit greater than zero.');
    try {
      await onSubmit({ ...form, month: Number(form.month), year: Number(form.year), limit: Number(form.limit) });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Could not save this budget.');
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid two">
        <Field label="Expense category" as="select" value={form.category} onChange={(event) => set('category', event.target.value)}>
          {EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Field>
        <Field label="Monthly limit" type="number" min="0.01" step="0.01" value={form.limit} onChange={(event) => set('limit', event.target.value)} placeholder="0.00" required />
        <Field label="Month" as="select" value={form.month} onChange={(event) => set('month', event.target.value)}>
          {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2024, index, 1))}</option>)}
        </Field>
        <Field label="Year" type="number" min="2000" max="2100" value={form.year} onChange={(event) => set('year', event.target.value)} required />
      </div>
      {error ? <div className="inline-error" role="alert">{error}</div> : null}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : initialValue ? 'Save changes' : 'Create budget'}</button>
      </div>
    </form>
  );
}
