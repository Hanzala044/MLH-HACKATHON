import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Bell, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBadge = () => {
      api.getReviewQueue().then(res => setReviewCount(res.total_flagged)).catch(() => {});
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 10000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'there';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.25rem 0.5rem',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* 1. Greeting Title (Matching reference image: "Good morning, Jordan") */}
      <div>
        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--text-main)',
          margin: 0
        }}>
          {getGreeting()}, {firstName}
        </h1>
      </div>

      {/* 2. Right Action Controls (Pill Search, Category filter, Bell, Primary Button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Search Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.45rem 1rem',
          boxShadow: 'var(--shadow-bento)',
          minWidth: '220px'
        }}>
          <Search size={15} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search receipts, GST..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') navigate('/ledger');
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
              width: '100%'
            }}
          />
        </div>

        {/* Dropdown Filter Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 0.85rem',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-bento)'
        }}>
          <span>🏢 All categories</span>
          <ChevronDown size={14} color="var(--text-dim)" />
        </div>

        {/* Notification Bell Pill */}
        <Link
          to="/review"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-bento)'
          }}
          title="Review Queue Notifications"
        >
          <Bell size={16} />
          {reviewCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-rose)'
            }} />
          )}
        </Link>

        {/* Primary Action Button (Matte Black Pill matching: "> View Leasing Pipeline") */}
        <Link
          to="/upload"
          className="btn btn-black"
          style={{
            padding: '0.55rem 1.15rem',
            fontSize: '0.825rem',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
          }}
        >
          <span>View Tax Pipeline</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
};
