import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal 
} from 'lucide-react';
import { api } from '../api';
import type { DashboardData, Receipt } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30days' | 'quarter' | 'year'>('30days');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDashboard('2026-10'),
      api.getReceipts()
    ])
      .then(([dashRes, recRes]) => {
        setData(dashRes);
        setReceipts(recRes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-black)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Loading expense intelligence...</p>
        </div>
      </div>
    );
  }

  const totalReceipts = data?.receipt_count || receipts.length || 128;
  const reviewCount = data?.needs_review_count ?? 4;

  // Pipeline funnel stages matching reference image
  const pipelineStages = [
    { label: 'New Upload', pct: '62%', count: `${totalReceipts}`, note: 'receipts', isHero: false, isPillYellow: true },
    { label: 'OCR Extracted', pct: '58%', count: `${Math.round(totalReceipts * 0.62)}`, note: 'verified', isHero: false },
    { label: 'Categorized', pct: '52%', count: `${Math.round(totalReceipts * 0.36)}`, note: 'mapped', isHero: false },
    { label: 'GST Validated', pct: '63%', count: `${Math.round(totalReceipts * 0.19)}`, note: 'invoices', isHero: false },
    { label: 'Approved', pct: '73%', count: `${Math.round(totalReceipts * 0.12)}`, note: 'audited', isHero: false },
    { label: 'Filed', pct: '88.6%', count: `${Math.round(totalReceipts * 0.086)}`, note: 'returns', isHero: true },
  ];

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
        {/* Card 1: New leads / New receipts */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            New receipts
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              128
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ 12%
            </span>
          </div>
        </div>

        {/* Card 2: Active conversations / Active vendors */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Active vendors
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              38
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ 6
            </span>
          </div>
        </div>

        {/* Card 3: Tours scheduled / Verified records */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Verified records
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              12
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ 3
            </span>
          </div>
        </div>

        {/* Card 4: Applications / Processed Invoices */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Processed bills
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              24
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↗ 4
            </span>
          </div>
        </div>

        {/* Card 5: Pending applications / Needs review */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Pending review
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              {reviewCount}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
              ↘ 2
            </span>
          </div>
        </div>

        {/* Card 6: Renewals due / Tax filing due */}
        <div className="bento-card" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            Filing deadlines
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>
              17
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)' }}>
              90 days
            </span>
          </div>
        </div>

        {/* Card 7: HERO CANARY YELLOW CARD (Conversion rate / Deductible rate) */}
        <div className="bento-card-yellow" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#000000' }}>
            Deductible rate
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#000000', lineHeight: 1 }}>
              8.6%
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#000000' }}>
              ↗ 1.2
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: EXPENSE PIPELINE BENTO CARD (Matching "Leasing pipeline")
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.75rem' }}>
        {/* Header with Title & Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
              Expense pipeline
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem', margin: 0 }}>
              New receipt to signed tax ledger • all categories
            </p>
          </div>

          {/* Time Filter Pills matching: 30 days | Quarter | Year | ... */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                    Filed
                  </div>
                ) : (
                  <div style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: stage.isPillYellow ? 'var(--accent-yellow)' : 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#000000'
                  }}>
                    {stage.label}
                  </div>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {stage.pct} &gt;
                </span>
              </div>

              {/* Progress Hatching Bar matching the architectural drawing */}
              <div style={{
                height: '42px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
              }}>
                {stage.isHero ? (
                  <div style={{
                    height: '100%',
                    width: '100%',
                    background: 'var(--accent-yellow)',
                    borderRadius: '8px'
                  }} />
                ) : (
                  <div className="hatch-pattern" style={{ height: '100%', width: '100%' }} />
                )}
              </div>

              {/* Number and Label below */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
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
          ROW 3: 3-COLUMN BENTO GRID (Today's tours | AI conversations | Alerts)
      ========================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* COLUMN 1: Today's expenses (Matching "Today's tours") */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Today's expenses
              </h3>
              <Link to="/ledger" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'none' }}>
                All expenses &gt;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Item 1 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', minWidth: '45px' }}>
                    10:30<br /><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>AM</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Uber India Technologies
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Cab to Udupi Railway Station • Auto-sync
                    </div>
                  </div>
                </div>
                <div className="status-pill status-pill-confirmed">
                  ● Confirmed
                </div>
              </div>

              {/* Item 2 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', minWidth: '45px' }}>
                    12:00<br /><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>PM</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      DigitalOcean LLC
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Cloud Droplet & Database • Self-led
                    </div>
                  </div>
                </div>
                <div className="status-pill status-pill-confirmed">
                  ● Confirmed
                </div>
              </div>

              {/* Item 3 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', minWidth: '45px' }}>
                    2:30<br /><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>PM</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Swiggy India
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Client dinner • Virtual bill
                    </div>
                  </div>
                </div>
                <div className="status-pill status-pill-scheduled">
                  ● Scheduled
                </div>
              </div>

              {/* Item 4 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', minWidth: '45px' }}>
                    4:30<br /><span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>PM</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      GitHub Inc
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Copilot Monthly • Tax audit
                    </div>
                  </div>
                </div>
                <div className="status-pill status-pill-rescheduled">
                  ● Rescheduled
                </div>
              </div>
            </div>
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
              Open slots today
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
                + 1:00 PM
              </button>
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
                + 3:30 PM
              </button>
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
                + 5:00 PM
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 2: AI receipts to review (Matching "AI conversations to review") */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                AI extractions to review
              </h3>
              <div style={{
                background: 'var(--accent-yellow)',
                color: '#000000',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)'
              }}>
                4 waiting
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
              The Gemma 4 assistant paused these for your call
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Item 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
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
                    MR
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Marcus Reed • Marlowe Court
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "Can you waive the tax fee on AWS dro..."
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        ⚡ Pricing exception
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        📊 High intent
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
                    4 min ago
                  </span>
                </div>
              </div>

              {/* Item 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--border-subtle)'
              }}>
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
                    AR
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Aisha Rahman • Juniper Flats
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "My tax rate was 18% instead of 5% CGST..."
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        ⚡ Screening question
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        ● Medium intent
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
                    12 min ago
                  </span>
                </div>
              </div>

              {/* Item 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between'
              }}>
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
                    KT
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Kevin Tran • Beacon Yard
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "I need to speak with a person about GSTIN..."
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        ⚡ Asked for human
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                        📊 High intent
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
                    18 min ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Applications missing info & renewals (Matching reference right column) */}
        <div className="bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1: Receipts missing info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#DC2626', fontSize: '0.825rem', fontWeight: 700 }}>
                <span>📁</span>
                <span>Invoices missing information</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>5 &gt;</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>DigitalOcean • NYC3 #88193</span>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Proof of GSTIN</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Uber India • Trip Udupi 221</span>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Tax Invoice</span>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          {/* Section 2: Filings due soon */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 700 }}>
                <span>🔄</span>
                <span>GST filings due soon</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>6 &gt;</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>GSTR-1 Tech Advisory • 305</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>28 days left</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>GSTR-3B Input Credit • 112</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>34 days left</span>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          {/* Section 3: Follow-ups due */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 700 }}>
                <span>⏱️</span>
                <span>Follow-ups due</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>8 &gt;</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Sarah Mitchell • Reconcile UPI</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Noah Patel • Post-tour check-in</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
