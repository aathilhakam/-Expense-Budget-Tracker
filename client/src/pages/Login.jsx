import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/auth/login', form);
      signIn(response.data.user);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Unable to sign in. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="auth-brand"><span className="brand-mark"><WalletCards size={20} /></span><span>finora</span></div>
        <div className="auth-pitch"><span className="auth-kicker">YOUR MONEY, IN FOCUS</span><h1>Make money decisions with clarity.</h1><p>Track your spending, plan with purpose, and build habits that move you forward.</p>
          <div className="auth-proof"><span className="proof-check">✓</span><span>Private, personal and always in your hands.</span></div>
        </div>
        <span className="auth-aside-foot">FINORA · TAKE CONTROL OF YOUR FINANCES</span>
      </aside>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <span className="auth-mobile-brand"><span className="brand-mark"><WalletCards size={19} /></span> finora</span>
          <div className="auth-heading"><span className="eyebrow-label">WELCOME BACK</span><h2>Sign in to Finora</h2><p>Enter your details to access your account.</p></div>
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field"><span>Email address</span><div className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></div></label>
            <label className="auth-field"><span>Password</span><div className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error ? <div className="inline-error" role="alert">{error}</div> : null}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="auth-switch">New to Finora? <Link to="/register">Create an account</Link></p>
          <p className="auth-security">Your financial data is private and protected.</p>
        </div>
      </main>
    </div>
  );
}
