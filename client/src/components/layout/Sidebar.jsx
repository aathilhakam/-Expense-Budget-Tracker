import { BarChart3, LayoutDashboard, LogOut, Settings, WalletCards, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: WalletCards },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { signOut } = useAuth();
  return (
    <>
      {open ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><WalletCards size={21} strokeWidth={2.5} /></span>
          <span>finora<small>Take Control of Your Finances</small></span>
          <button className="sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="nav-caption">MENU</div>
        <nav className="side-nav" aria-label="Primary navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="note-spark">✦</span><strong>Small steps add up</strong><p>Stay consistent and keep building your financial future.</p></div>
          <button className="side-link logout-link" onClick={signOut}><LogOut size={19} /><span>Log out</span></button>
          <div className="sidebar-footer">FINORA · PERSONAL FINANCE</div>
        </div>
      </aside>
    </>
  );
}
