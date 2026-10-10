import { useEffect, useState } from 'react';
import Field from '../common/Field.jsx';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories.js';

const today = () => new Date().toISOString().slice(0, 10);
const emptyTransaction = () => ({ type: 'expense', amount: '', category: 'Food', date: today(), description: '' });

export default function TransactionForm({ initialValue, onSubmit, onCancel, busy = false }) {
  const [form, setForm] = useState(initialValue || emptyTransaction());
  const [formError, setFormError] = useState('');
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (initialValue) setForm({ ...initialValue, date: initialValue.date?.slice(0, 10) || today() });
  }, [initialValue]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!(Number(form.amount) > 0)) return setFormError('Enter an amount greater than zero.');
    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Could not save this transaction. Please try again.');
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid two">
        <Field label="Transaction type" as="select" value={form.type} onChange={(event) => {
          const type = event.target.value;
          setForm((current) => ({ ...current, type, category: type === 'income' ? 'Salary' : 'Food' }));
        }}>
          <option value="expense">Expense</option><option value="income">Income</option>
        </Field>
        <Field label="Amount" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => set('amount', event.target.value)} required />
        <Field label="Category" as="select" value={form.category} onChange={(event) => set('category', event.target.value)}>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </Field>
        <Field label="Date" type="date" value={form.date} onChange={(event) => set('date', event.target.value)} required />
      </div>
      <Field label="Description" as="textarea" rows="3" maxLength="160" placeholder="Add a note about this transaction" value={form.description} onChange={(event) => set('description', event.target.value)} />
      {formError ? <div className="inline-error" role="alert">{formError}</div> : null}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : initialValue ? 'Save changes' : 'Add transaction'}</button>
      </div>
    </form>
  );
}
