import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export const GstSummary: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('2026-10');

  useEffect(() => {
    setLoading(true);
    api.getGstSummary(month)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            GST Input Tax Credit Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Prepared for Indian Freelancers & Small Businesses filing GSTR-3B / GSTR-4
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <Calendar size={15} color="#94a3b8" />
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="2026-10" style={{ background: '#101623' }}>October 2026</option>
            <option value="2026-09" style={{ background: '#101623' }}>September 2026</option>
            <option value="2026-08" style={{ background: '#101623' }}>August 2026</option>
          </select>
        </div>
      </div>

      {/* Informational Disclaimer (PRD Page 9) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        color: '#38bdf8',
        fontSize: '0.8rem',
        marginBottom: '1.5rem'
      }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Tax Note:</strong> Informational only. Not official legal or tax advice. Use this summary for accountant consultation and GSTR reconciliation.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Taxable Value</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.35rem' }}>
            ₹{(data?.summary?.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Net expense before taxes</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>CGST Claimable</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.35rem' }}>
            ₹{(data?.summary?.total_cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Central GST</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SGST Claimable</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', marginTop: '0.35rem' }}>
            ₹{(data?.summary?.total_sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>State GST</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>IGST Claimable</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', marginTop: '0.35rem' }}>
            ₹{(data?.summary?.total_igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Integrated Interstate GST</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>Total ITC Claimable</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
            ₹{(data?.summary?.total_tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{data?.summary?.invoice_count || 0} qualifying bills</span>
        </div>
      </div>

      {/* GST Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Vendor</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Taxable (₹)</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Rate</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>CGST (₹)</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>SGST (₹)</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>IGST (₹)</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Total Tax</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Consistency</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Aggregating GST breakdown...
                  </td>
                </tr>
              ) : (data?.items?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No qualifying GST invoices found for this month.
                  </td>
                </tr>
              ) : (
                data?.items?.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {item.date}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.vendor}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {item.invoice_number}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      ₹{item.taxable_amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)' }}>
                      {item.tax_rate ? `${item.tax_rate}%` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#38bdf8' }}>
                      {item.cgst > 0 ? `₹${item.cgst.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#818cf8' }}>
                      {item.sgst > 0 ? `₹${item.sgst.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#c084fc' }}>
                      {item.igst > 0 ? `₹${item.igst.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#34d399' }}>
                      ₹{item.total_tax.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {item.is_consistent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                          <CheckCircle size={14} />
                          <span>Math Valid</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }} title={item.warning}>
                          <AlertTriangle size={14} />
                          <span>Discrepancy</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        to={`/receipts/${item.receipt_id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
