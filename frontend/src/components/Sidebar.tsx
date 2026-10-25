import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ReceiptText, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Menu, 
  ChevronDown, 
  Database, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { useClerkConfig } from '../context/ClerkWrapper';

export const Sidebar: React.FC = () => {
  const { logout, user, isClerkAuth } = useAuth();
  const { isClerkConfigured } = useClerkConfig();

  const journeyItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, count: '' },
    { to: '/upload', label: 'Inbox & Upload', icon: UploadCloud, count: '128' },
    { to: '/ledger', label: 'Expense Ledger', icon: ReceiptText, count: '38' },
    { to: '/review', label: 'Review Queue', icon: AlertCircle, count: '12' },
    { to: '/gst', label: 'GST Summary', icon: FileSpreadsheet, count: '24' },
    { to: '/ask', label: 'Ask Gemma', icon: Sparkles, count: '17' },
  ];

  const workspaceItems = [
    { to: '/settings', label: 'Supabase & Cloud', icon: Database, count: '9' },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, count: '' },
  ];

  const userInitials = (user?.full_name || user?.email || 'RW')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside style={{
      width: '260px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      flexShrink: 0
    }}>
      {/* 1. Brand Logo Header & Hamburger */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.25rem 0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'var(--accent-black)',
            color: 'var(--accent-yellow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}>
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Receipt<span style={{ fontWeight: 600 }}>Wise</span>
          </span>
        </div>

        <button
          type="button"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <Menu size={16} />
        </button>
      </div>

      {/* 2. Workspace Selector Card */}
      <div className="bento-card" style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            🏢
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name ? `${user.full_name.split(' ')[0]}'s Workspace` : 'Primary Workspace'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              6 active ledgers
            </span>
          </div>
        </div>
        <ChevronDown size={15} color="var(--text-dim)" />
      </div>

      {/* 3. Navigation Group: Expense Journey */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        <div style={{ padding: '0.5rem 0.65rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
          Expense journey
        </div>

        {journeyItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--accent-black)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={17} color={isActive ? '#FFFFFF' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isActive ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-dim)'
                    }}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Workspace section */}
        <div style={{ padding: '1rem 0.65rem 0.25rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
          Workspace
        </div>

        {workspaceItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--accent-black)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={17} color={isActive ? '#FFFFFF' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isActive ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-dim)'
                    }}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* 4. Hero Canary Yellow AI Card (Matching reference design) */}
      <div className="bento-card-yellow" style={{
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#000000',
              color: 'var(--accent-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.75rem'
            }}>
              AI
            </div>
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#000000', lineHeight: 1.1 }}>
                ReceiptWise AI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(0, 0, 0, 0.65)', fontWeight: 600 }}>
                On • Gemma 4
              </div>
            </div>
          </div>

          {/* Toggle pill */}
          <div style={{
            width: '38px',
            height: '22px',
            borderRadius: '9999px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '2px',
            cursor: 'pointer'
          }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent-yellow)' }} />
          </div>
        </div>

        {/* Link to Review Queue with 4 need review */}
        <Link
          to="/review"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 'var(--radius-full)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textDecoration: 'none',
            color: '#000000',
            fontSize: '0.775rem',
            fontWeight: 700,
            transition: 'background 0.15s ease'
          }}
        >
          <span>4 need your review</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* 5. User Profile Card at Bottom */}
      <div className="bento-card" style={{
        padding: '0.75rem 0.95rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--accent-black)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 800,
            flexShrink: 0
          }}>
            {userInitials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || 'Asha Patel'}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || 'asha@example.com'}
            </span>
          </div>
        </div>

        {isClerkConfigured && isClerkAuth ? (
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: { width: '28px', height: '28px' }
              }
            }}
          />
        ) : (
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
