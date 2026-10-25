import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Copy, 
  Calculator, 
  HelpCircle, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

export const ReviewQueue: React.FC = () => {
  const [data, setData] = useState<{
    needs_review: Receipt[];
    duplicates: Receipt[];
    gst_warnings: Receipt[];
    low_confidence: Receipt[];
    total_flagged: number;
  }>({
    needs_review: [],
    duplicates: [],
    gst_warnings: [],
    low_confidence: [],
    total_flagged: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'needs_review' | 'duplicates' | 'gst' | 'low_confidence'>('needs_review');

  useEffect(() => {
    setLoading(true);
    api.getReviewQueue()
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'needs_review', label: 'All Flagged', count: data.needs_review.length, icon: AlertTriangle, color: '#f59e0b' },
    { id: 'duplicates', label: 'Duplicates', count: data.duplicates.length, icon: Copy, color: '#ec4899' },
    { id: 'gst', label: 'GST Math Discrepancy', count: data.gst_warnings.length, icon: Calculator, color: '#f43f5e' },
    { id: 'low_confidence', label: 'Low Quality / Confidence', count: data.low_confidence.length, icon: HelpCircle, color: '#38bdf8' },
  ];

  const currentList = activeTab === 'needs_review' ? data.needs_review
    : activeTab === 'duplicates' ? data.duplicates
    : activeTab === 'gst' ? data.gst_warnings
    : data.low_confidence;

  return (
    <div className="page-wrapper" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Human Review Queue
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Gemma 4 automated anomalies and validation warnings requiring verification
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`btn-pill ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 0.95rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={isActive ? '#FFFFFF' : 'var(--text-muted)'} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card-subtle)',
                color: isActive ? '#FFFFFF' : 'var(--text-dim)',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Container */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
            Scanning review queue...
          </div>
        ) : currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={30} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Queue is completely clear!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              All uploaded documents have been verified and confirmed into your tax ledger.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentList.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {r.vendor || r.original_filename}
                    </span>
                    <span className="badge badge-review">
                      Review Suggested
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '0.25rem' }}>
                    {r.review_reason || r.warnings?.join(' • ') || 'Verification flagged'}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Total: {r.currency || '₹'} {r.total?.toFixed(2) || '—'} • Date: {r.receipt_date || 'Pending'} • Confidence: {Math.round((r.confidence || 0.7) * 100)}%
                  </div>
                </div>

                <Link
                  to={`/receipts/${r.id}`}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                >
                  <span>Verify Record</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
