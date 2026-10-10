import { Menu, Plus, Search } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';

const titles = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const initials = (user?.name || 'F').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <div className="app-layout">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-column">
        <header className="top-nav">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
          <div className="top-nav-title">{titles[location.pathname] || 'Finora'}</div>
          <div className="top-nav-actions">
            <label className="global-search"><Search size={17} /><input aria-label="Search transactions" placeholder="Search transactions" onKeyDown={(event) => {
              if (event.key === 'Enter' && event.currentTarget.value.trim()) navigate(`/transactions?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
            }} /></label>
            <button className="button button-primary nav-add" onClick={() => navigate('/transactions?new=1')}><Plus size={17} /><span>New transaction</span></button>
            <button className="profile-pill" onClick={() => navigate('/settings')} aria-label="Open settings">
              <span className="avatar">{initials}</span><span className="profile-name">{user?.name}</span>
            </button>
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
