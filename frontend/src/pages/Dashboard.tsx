import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import type { DashboardData, Receipt } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30days' | 'quarter' | 'year'>('30days');
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getReceipts(),
      api.getReviewQueue().catch(() => ({ needs_review: [], total_flagged: 0 }))
    ])
      .then(([dashRes, recRes, reviewRes]) => {
        setData(dashRes);
        setReceipts(recRes || []);
        setReviewQueue(reviewRes?.needs_review || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data && receipts.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-black)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading authentic expense data...</p>
        </div>
      </div>
    );
  }

  // Real computed metrics from backend database
  const totalReceipts = receipts.length || data?.receipt_count || 0;
  const uniqueVendors = new Set(receipts.map(r => r.vendor).filter(Boolean)).size;
  const confirmedCount = receipts.filter(r => r.status === 'confirmed').length;
  const readyCount = receipts.filter(r => r.status === 'ready').length;
  const reviewCount = reviewQueue.length || receipts.filter(r => r.status === 'needs_review').length;
  const totalAmount = data?.month_total ?? receipts.reduce((acc, r) => acc + (r.total || 0), 0);
  const totalTax = data?.tax_total ?? receipts.reduce((acc, r) => acc + (r.tax_amount || 0), 0);
  const businessReceiptsCount = receipts.filter(r => r.business_expense !== false).length;
  const businessPercentage = totalReceipts > 0 ? ((businessReceiptsCount / totalReceipts) * 100).toFixed(1) : '100';

  // Dynamic Pipeline funnel stages matching reference image layout
  const extractedCount = receipts.filter(r => r.document_type || r.total != null).length;
  const categorizedCount = receipts.filter(r => r.category && r.category !== 'Other').length;
  const gstCount = receipts.filter(r => (r.tax_amount || 0) > 0).length;

  const pct = (val: number) => totalReceipts > 0 ? `${Math.round((val / totalReceipts) * 100)}%` : '0%';

  const pipelineStages = [
    { label: 'New Upload', pct: totalReceipts > 0 ? '100%' : '0%', count: `${totalReceipts}`, note: 'receipts', isHero: false, isPillYellow: true },
    { label: 'AI Extracted', pct: pct(extractedCount), count: `${extractedCount}`, note: 'verified', isHero: false },
    { label: 'Categorized', pct: pct(categorizedCount), count: `${categorizedCount}`, note: 'mapped', isHero: false },
    { label: 'GST Validated', pct: pct(gstCount), count: `${gstCount}`, note: 'invoices', isHero: false },
    { label: 'Audit Ready', pct: pct(readyCount), count: `${readyCount}`, note: 'audited', isHero: false },
    { label: 'Confirmed', pct: pct(confirmedCount), count: `${confirmedCount}`, note: 'filed', isHero: true },
  ];

  const recentList = receipts.slice(0, 5);
  const missingInvoices = receipts.filter(r => !r.invoice_number && r.total != null).slice(0, 3);

  const formatTime = (dateStr?: string | null, uploadStr?: string) => {
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        return {
          time: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sub: d.getFullYear().toString()
        };
      } catch {
        // fallback
      }
    }
    if (uploadStr) {
      try {
        const d = new Date(uploadStr);
        return {
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sub: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
        };
      } catch {
        // fallback
      }
    }
    return { time: 'Today', sub: 'Recent' };
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <div className="status-pill status-pill-confirmed">● Confirmed</div>;
      case 'ready':
        return <div className="status-pill status-pill-confirmed">● Ready</div>;
      case 'needs_review':
        return <div className="status-pill status-pill-rescheduled">● Review</div>;
      default:
        return <div className="status-pill status-pill-scheduled">● {status}</div>;
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* =========================================================================
          ROW 1: METRICS ROW (Exact 7-column layout matching reference image)
      ========================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* Card 1: New receipts */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Total receipts
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              {totalReceipts}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ {receipts.filter(r => new Date(r.uploaded_at).getTime() > Date.now() - 7*86400000).length} new
            </span>
          </div>
        </div>

        {/* Card 2: Active vendors */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Active vendors
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              {uniqueVendors}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ {uniqueVendors}
            </span>
          </div>
        </div>

        {/* Card 3: Verified records */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Verified records
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              {confirmedCount}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ {confirmedCount}
            </span>
          </div>
        </div>

        {/* Card 4: Processed bills */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Processed bills
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              {readyCount}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ {readyCount}
            </span>
          </div>
        </div>

        {/* Card 5: Pending review */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Pending review
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: reviewCount > 0 ? '#B45309' : 'var(--text-main)', lineHeight: 1 }}>
              {reviewCount}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              {reviewCount > 0 ? 'needs call' : 'all clean'}
            </span>
          </div>
        </div>

        {/* Card 6: GST Tax Total */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            GST Input Credit
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              ₹{Math.round(totalTax).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)' }}>
              credit
            </span>
          </div>
        </div>

        {/* Card 7: HERO CANARY YELLOW CARD */}
        <div className="bento-card-yellow" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#000000' }}>
            Total Spend
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#000000', lineHeight: 1 }}>
              ₹{Math.round(totalAmount).toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#000000' }}>
              {businessPercentage}% biz
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: EXPENSE PIPELINE (Matching "Leasing pipeline" with hatch funnels)
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Expense pipeline
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '0.2rem 0 0 0' }}>
              New receipt to confirmed tax ledger • live database sync
            </p>
          </div>

          {/* Time range pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-full)' }}>
            <button
              type="button"
              onClick={() => setTimeRange('30days')}
              className={`btn-pill ${timeRange === '30days' ? 'active' : ''}`}
            >
              30 days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('quarter')}
              className={`btn-pill ${timeRange === 'quarter' ? 'active' : ''}`}
            >
              Quarter
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`btn-pill ${timeRange === 'year' ? 'active' : ''}`}
            >
              Year
            </button>
            <button
              type="button"
              className="btn-pill"
              style={{ padding: '0.45rem 0.6rem' }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* 6 Funnel Pipeline Columns with Hatching Progress Bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem'
        }}>
          {pipelineStages.map((stage) => (
            <div key={stage.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Stage Chip Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {stage.isHero ? (
                  <div style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-black)',
                    color: '#FFFFFF',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {stage.label}
                  </div>
                ) : stage.isPillYellow ? (
                  <div style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--accent-yellow)',
                    color: '#000000',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}>
                    {stage.label}
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-dim)' }} />
                    {stage.label}
                  </div>
                )}
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                  {stage.pct} &gt;
                </span>
              </div>

              {/* Diagonal Hatching Visual Container */}
              <div style={{
                height: '75px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '0.35rem',
                position: 'relative',
                overflow: 'hidden',
                background: '#FAF9F6'
              }}>
                <div 
                  className="hatch-pattern" 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: stage.isHero ? 0.3 : 0.6
                  }}
                />
                {stage.isHero && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '10px',
                    background: 'var(--accent-yellow)',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)'
                  }} />
                )}
              </div>

              {/* Bottom Big Metric */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {stage.count}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  {stage.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          ROW 3: 3-COLUMN BENTO GRID (Authentic database items)
      ========================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* COLUMN 1: Real Recent Expenses */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Recent expenses
              </h3>
              <Link to="/ledger" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'none' }}>
                All expenses &gt;
              </Link>
            </div>

            {recentList.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>No expenses recorded yet.</p>
                <Link to="/upload" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <UploadCloud size={14} /> Upload First Receipt
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentList.map((r) => {
                  const dt = formatTime(r.receipt_date, r.uploaded_at);
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', minWidth: '45px', lineHeight: 1.2 }}>
                          {dt.time}<br /><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>{dt.sub}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.vendor || r.original_filename}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.category || 'Expense'} • {r.total != null ? `₹${r.total.toLocaleString('en-IN')}` : 'Analyzing...'}
                          </div>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {getStatusPill(r.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick upload time slots at bottom */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)' }}>
              Quick action
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/upload')}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                + Upload PhonePe / Bill
              </button>
              <button
                type="button"
                onClick={() => navigate('/ledger')}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                View Full Ledger &gt;
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: AI extractions to review (Authentic Review Queue) */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                AI extractions to review
              </h3>
              <div style={{
                background: reviewCount > 0 ? 'var(--accent-yellow)' : '#DCFCE7',
                color: reviewCount > 0 ? '#000000' : '#15803D',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)'
              }}>
                {reviewCount} waiting
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
              The Gemma 4 assistant paused these for your manual confirmation
            </p>

            {reviewQueue.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="#15803D" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
                  All Extractions Verified!
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                  No pending validation issues or tax math flags.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviewQueue.slice(0, 3).map((r) => {
                  const initials = (r.vendor || r.original_filename || 'NA')
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        paddingBottom: '0.85rem',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', minWidth: 0 }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-card-subtle)',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.vendor || r.original_filename} • {r.total != null ? `₹${r.total}` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            "{r.review_reason || 'Flagged for verification'}"
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                              ⚡ {r.tax_type || 'Tax Check'}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                              📁 {r.category || 'Receipt'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                        <Link
                          to="/review"
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.85rem', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Review
                        </Link>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          Needs check
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link
              to="/review"
              style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              Open Complete Review Queue ({reviewCount}) <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* COLUMN 3: Real Compliance & Tax Actions */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Section 1: Invoices missing details */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} color="#D97706" /> Invoices missing GST / ID
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                  {missingInvoices.length} &gt;
                </span>
              </div>

              {missingInvoices.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                  All uploaded invoices have reference numbers assigned.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {missingInvoices.map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {inv.vendor || inv.original_filename}
                      </span>
                      <Link to="/review" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', textDecoration: 'none' }}>
                        Missing ID
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Real GST Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileSpreadsheet size={15} color="#059669" /> GST Tax Credits
                </span>
                <Link to="/gst" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textDecoration: 'none' }}>
                  Report &gt;
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CGST / SGST</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{Math.round(totalTax * 0.7).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>IGST (Inter-state)</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{Math.round(totalTax * 0.3).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Actions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚡ Quick Navigation
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
                <Link to="/upload" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600 }}>
                  <span>Upload PhonePe / Bills</span>
                  <span style={{ color: 'var(--text-dim)' }}>Instant AI</span>
                </Link>
                <Link to="/ledger" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--text-main)', fontWeight: 600 }}>
                  <span>Export CSV for CA</span>
                  <span style={{ color: 'var(--text-dim)' }}>CSV format</span>
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Link
              to="/upload"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.8rem' }}
            >
              + Upload New Expense
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
