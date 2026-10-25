import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

const CATEGORIES = [
  'All',
  'Software & SaaS',
  'Cloud Hosting',
  'Travel',
  'Food & Meals',
  'Office Supplies',
  'Internet & Utilities',
  'Hardware',
  'Professional Services',
  'Marketing',
  'Education',
  'Other'
];

export const Ledger: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('');
  const [businessOnly, setBusinessOnly] = useState<boolean | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'vendor' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLedger = () => {
    setLoading(true);
    api.getLedger({
      q: search,
      category: category === 'All' ? undefined : category,
      status: status || undefined,
      business_only: businessOnly,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: pageSize
    })
      .then(res => {
        setReceipts(res.items);
        setTotalItems(res.total_items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLedger();
  }, [search, category, status, businessOnly, fromDate, toDate, sortBy, sortOrder, page]);

  const handleExportCsv = () => {
    const url = api.exportCsvUrl({
      q: search,
      category: category === 'All' ? undefined : category,
      status: status || undefined,
      business_only: businessOnly,
      from_date: fromDate || undefined,
      to_date: toDate || undefined
    });
    window.open(url, '_blank');
  };

  const filteredTotal = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const filteredTax = receipts.reduce((sum, r) => sum + (r.tax_amount || 0), 0);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Expense Ledger
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Auditable, tax-ready financial ledger with human verification history
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <Download size={15} />
          <span>Export Accountant CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search vendor, bill #..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category */}
          <select
            className="select"
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c} style={{ background: '#0f172a' }}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          {/* Status */}
          <select
            className="select"
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="" style={{ background: '#0f172a' }}>All Statuses</option>
            <option value="confirmed" style={{ background: '#0f172a' }}>Confirmed</option>
            <option value="ready" style={{ background: '#0f172a' }}>Ready to Review</option>
            <option value="needs_review" style={{ background: '#0f172a' }}>Needs Review</option>
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              className="input"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              title="From date"
            />
            <input
              type="date"
              className="input"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              title="To date"
            />
          </div>
        </div>

        {/* Quick toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={businessOnly === true}
              onChange={e => setBusinessOnly(e.target.checked ? true : undefined)}
              style={{ accentColor: '#10b981' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Business Expenses Only</span>
          </label>

          {(search || category !== 'All' || status || fromDate || toDate || businessOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('All');
                setStatus('');
                setFromDate('');
                setToDate('');
                setBusinessOnly(undefined);
                setPage(1);
              }}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th 
                  onClick={() => { setSortBy('date'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}
                  style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Date</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th 
                  onClick={() => { setSortBy('vendor'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}
                  style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Vendor</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Tax Type</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Tax Amount</th>
                <th 
                  onClick={() => { setSortBy('total'); setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }}
                  style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span>Total</span>
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Payment</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    Loading ledger records...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No expenses match your search filters.
                  </td>
                </tr>
              ) : (
                receipts.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {r.receipt_date || 'Pending'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      <div>{r.vendor || r.original_filename}</div>
                      {r.invoice_number && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>#{r.invoice_number}</span>}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {r.category || 'Other'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {r.tax_type || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {r.tax_amount !== undefined && r.tax_amount !== null ? `₹${r.tax_amount.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {r.total !== undefined && r.total !== null ? `${r.currency || '₹'} ${r.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: r.payment_status === 'paid' ? '#34d399' : '#fbbf24'
                      }}>
                        {r.payment_status?.toUpperCase() || 'PAID'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge badge-${r.status}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        to={`/receipts/${r.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Totals & Pagination Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Showing {receipts.length} of {totalItems} records
            </span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              Page Total: ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Tax: ₹{filteredTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              Page {page} of {Math.ceil(totalItems / pageSize) || 1}
            </span>
            <button
              type="button"
              disabled={page * pageSize >= totalItems}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
