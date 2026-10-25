import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  Calendar,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../api';
import type { DashboardData } from '../types';

const CATEGORY_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#64748b'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  useEffect(() => {
    setLoading(true);
    api.getDashboard(selectedMonth)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  if (loading && !data) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
          <p>Loading your expense intelligence...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'October Spend',
      value: `₹${(data?.month_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: `${data?.confirmed_count || 0} confirmed records`,
      icon: TrendingUp,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'GST Input Tax',
      value: `₹${(data?.tax_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: 'Tax claimable this month',
      icon: Layers,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)'
    },
    {
      title: 'Unpaid Invoices',
      value: `₹${(data?.unpaid_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      subtitle: 'Pending vendor clearance',
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Needs Human Review',
      value: data?.needs_review_count || 0,
      subtitle: 'Ambiguous or low confidence',
      icon: AlertTriangle,
      color: (data?.needs_review_count || 0) > 0 ? '#f43f5e' : '#34d399',
      bg: (data?.needs_review_count || 0) > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      link: '/review'
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Financial Overview
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Multi-modal document extraction powered by Google DeepMind Gemma 4
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar size={15} color="#94a3b8" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="2026-10" style={{ background: '#101623' }}>October 2026</option>
              <option value="2026-09" style={{ background: '#101623' }}>September 2026</option>
              <option value="2026-08" style={{ background: '#101623' }}>August 2026</option>
            </select>
          </div>

          <Link to="/upload" className="btn btn-primary">
            <Plus size={16} />
            <span>Upload Receipt</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const CardContent = (
            <div key={idx} className="glass-panel glow-hover" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {card.title}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {card.subtitle}
              </div>
            </div>
          );

          return card.link ? (
            <Link key={idx} to={card.link} style={{ textDecoration: 'none', color: 'inherit' }}>
              {CardContent}
            </Link>
          ) : CardContent;
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Category Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Spend by Category</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Confirmed Expenses</span>
          </div>

          {(data?.category_breakdown?.length || 0) === 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No confirmed expenses for this month yet.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', height: '260px' }}>
              <div style={{ flex: 1, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.category_breakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {data?.category_breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ width: '170px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                {data?.category_breakdown.slice(0, 5).map((cat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length], flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)' }}>
                        {cat.category}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6-Month Monthly Trend */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>6-Month Spending Trend</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Spend vs Tax</span>
          </div>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={val => `₹${val}`} />
                <Tooltip 
                  formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString('en-IN')}`, name === 'total' ? 'Spend' : 'Tax']}
                  contentStyle={{ background: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Spend" />
                <Bar dataKey="tax" fill="#06b6d4" radius={[4, 4, 0, 0]} name="GST Tax" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Documents</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extracted files and verification status</p>
          </div>
          <Link to="/ledger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            <span>View Full Ledger</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {(data?.recent_receipts?.length || 0) === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Receipt size={40} strokeWidth={1.5} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No Receipts Yet</h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>Upload your first bill, invoice or payment screenshot to get started.</p>
            <Link to="/upload" className="btn btn-primary">
              <Plus size={15} />
              <span>Upload Receipt</span>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Vendor</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Confidence</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_receipts.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div>{r.vendor || r.original_filename}</div>
                      {r.invoice_number && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>#{r.invoice_number}</span>}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {r.receipt_date || 'Pending'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {r.category || 'Other'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {r.total !== undefined && r.total !== null ? `${r.currency || '₹'} ${r.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {r.confidence ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: r.confidence >= 0.9 ? '#34d399' : '#fbbf24' }}>
                            {Math.round(r.confidence * 100)}%
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${r.status}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <Link
                        to={`/receipts/${r.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
