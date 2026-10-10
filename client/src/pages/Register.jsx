import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Your passwords do not match.');
    if (form.password.length < 8 || !/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError('Use at least 8 characters, including uppercase, lowercase, and a number.');
    }
    setBusy(true);
    try {
      const response = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      signIn(response.data.user);
      navigate('/', { replace: true });
    } catch (registerError) {
      const validation = registerError.response?.data?.errors?.[0]?.message;
      setError(validation || registerError.response?.data?.message || 'Unable to create your account. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="auth-brand"><span className="brand-mark"><WalletCards size={20} /></span><span>finora</span></div>
        <div className="auth-pitch"><span className="auth-kicker">A FRESH START</span><h1>Build a healthier relationship with money.</h1><p>Bring everyday spending and long-term plans together in one calm, clear space.</p>
          <div className="auth-proof"><span className="proof-check">✓</span><span>Private by design. Yours to manage.</span></div>
        </div>
        <span className="auth-aside-foot">FINORA · TAKE CONTROL OF YOUR FINANCES</span>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <span className="auth-mobile-brand"><span className="brand-mark"><WalletCards size={19} /></span> finora</span>
          <div className="auth-heading"><span className="eyebrow-label">GET STARTED</span><h2>Create your account</h2><p>Set up your private space to manage your finances.</p></div>
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={17} /><input type="text" autoComplete="name" minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" required /></div></label>
            <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></div></label>
            <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            <label className="auth-field"><span>Confirm password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Re-enter your password" required /></div></label>
            {error ? <div className="inline-error" role="alert">{error}</div> : null}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          <p className="auth-security">Your financial data is private and protected.</p>
        </div>
      </main>
    </div>
  );
}
