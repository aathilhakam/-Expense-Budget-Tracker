import { useEffect, useState } from 'react';
import { LogOut, Save, UserRound } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CURRENCY_OPTIONS } from '../utils/categories.js';
import Field from '../components/common/Field.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

export default function Settings() {
  const { user, signIn, signOut } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', preferredCurrency: user?.preferredCurrency || 'LKR' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => setForm({ name: user?.name || '', preferredCurrency: user?.preferredCurrency || 'LKR' }), [user]);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await api.put('/users/profile', form);
      signIn(response.data.user);
      setMessage('Your profile settings have been saved.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not save your settings.');
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and financial preferences." />
      {message ? <div className="success-banner" role="status">{message}</div> : null}
      {error ? <div className="error-banner" role="alert">{error}</div> : null}
      <section className="settings-layout">
        <article className="panel settings-profile">
          <div className="settings-section-head"><span className="settings-icon"><UserRound size={19} /></span><div><h2>Profile information</h2><p>Update how your account appears in Finora.</p></div></div>
          <form className="form-stack settings-form" onSubmit={save}>
            <Field label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" maxLength="80" required />
            <Field label="Email address" type="email" value={user?.email || ''} disabled />
            <Field label="Preferred currency" as="select" value={form.preferredCurrency} onChange={(event) => setForm({ ...form, preferredCurrency: event.target.value })}>
              {CURRENCY_OPTIONS.map((currency) => <option value={currency} key={currency}>{currency}{currency === 'LKR' ? ' — Sri Lankan Rupee' : ''}</option>)}
            </Field>
            <p className="settings-hint">This preference controls how financial amounts are displayed throughout your account.</p>
            <div className="form-actions settings-actions"><button className="button button-primary" type="submit" disabled={busy}><Save size={16} />{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </article>
        <article className="panel account-panel">
          <h2>Account</h2><p>Sign out of your Finora account on this device.</p>
          <button className="button button-secondary" onClick={signOut}><LogOut size={16} /> Log out</button>
        </article>
      </section>
    </>
  );
}
