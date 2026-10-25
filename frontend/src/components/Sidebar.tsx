import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ReceiptText, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles, 
  Settings as SettingsIcon, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Receipt', icon: UploadCloud },
    { to: '/ledger', label: 'Expense Ledger', icon: ReceiptText },
    { to: '/review', label: 'Review Queue', icon: AlertCircle },
    { to: '/gst', label: 'GST Summary', icon: FileSpreadsheet },
    { to: '/ask', label: 'Ask Receipts', icon: Sparkles },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      flexShrink: 0
    }}>
      {/* Brand logo & name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 1.75rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#022c22',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
        }}>
          <ShieldCheck size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Receipt<span className="gradient-text">Wise</span>
          </h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            Gemma 4 • Privacy First
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1.5rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.18s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info & logout */}
      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.full_name || user?.email || 'User'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {user?.email}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  );
};
