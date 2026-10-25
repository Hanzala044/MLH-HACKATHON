import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Bell, Upload, Shield } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchBadge = () => {
      api.getReviewQueue().then(res => setReviewCount(res.total_flagged)).catch(() => {});
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(16, 22, 35, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Model status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#34d399'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} className="pulse-indicator" />
          <Cpu size={14} />
          <span>Gemma 4: {user?.model_mode === 'local' ? 'Local Ollama' : 'Cloud DeepMind API'}</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)'
        }}>
          <Shield size={12} color="#06b6d4" />
          <span>Self-Hosted & Private</span>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          to="/review"
          style={{
            position: 'relative',
            color: reviewCount > 0 ? '#fbbf24' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            background: reviewCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
            border: reviewCount > 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid transparent'
          }}
          title="Review Queue"
        >
          <Bell size={18} />
          {reviewCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#f59e0b',
              color: '#000',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {reviewCount}
            </span>
          )}
        </Link>

        <Link to="/upload" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
          <Upload size={15} />
          <span>Upload Receipt</span>
        </Link>
      </div>
    </header>
  );
};
