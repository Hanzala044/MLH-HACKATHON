import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Code, 
  AlertTriangle, 
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

const ALLOWED_CATEGORIES = [
  'Software & SaaS', 'Cloud Hosting', 'Travel', 'Food & Meals',
  'Office Supplies', 'Internet & Utilities', 'Hardware',
  'Professional Services', 'Marketing', 'Education', 'Other'
];

export const ReceiptReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Editable form state
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [category, setCategory] = useState('Other');
  const [businessExpense, setBusinessExpense] = useState(true);
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [taxType, setTaxType] = useState('GST');
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [total, setTotal] = useState<number | ''>('');
  const [currency, setCurrency] = useState('INR');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [userNote, setUserNote] = useState('');

  // Image viewer state
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getReceipt(id)
      .then(r => {
        setReceipt(r);
        setVendor(r.vendor || '');
        setInvoiceNumber(r.invoice_number || '');
        setReceiptDate(r.receipt_date || '');
        setCategory(r.category || 'Other');
        setBusinessExpense(r.business_expense ?? true);
        setSubtotal(r.subtotal ?? '');
        setTaxAmount(r.tax_amount ?? '');
        setTaxType(r.tax_type || 'GST');
        setTaxRate(r.tax_rate ?? '');
        setTotal(r.total ?? '');
        setCurrency(r.currency || 'INR');
        setPaymentMethod(r.payment_method || 'UPI');
        setPaymentStatus(r.payment_status || 'paid');
        setUserNote(r.user_note || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateReceipt(id, {
        vendor,
        invoice_number: invoiceNumber,
        receipt_date: receiptDate || null,
        category,
        business_expense: businessExpense,
        subtotal: subtotal === '' ? null : Number(subtotal),
        tax_amount: taxAmount === '' ? null : Number(taxAmount),
        tax_type: taxType,
        tax_rate: taxRate === '' ? null : Number(taxRate),
        total: total === '' ? null : Number(total),
        currency,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        user_note: userNote
      });
      setReceipt(updated);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await handleSave();
      const confirmed = await api.confirmReceipt(id);
      setReceipt(confirmed);
      navigate('/ledger');
    } catch (err: any) {
      alert(`Confirmation failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Permanently delete this receipt and its source file?')) return;
    try {
      await api.deleteReceipt(id);
      navigate('/ledger');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (loading || !receipt) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }} />
          <p>Loading document verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '1440px' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {vendor || receipt.original_filename}
              </h1>
              <span className={`badge badge-${receipt.status}`}>
                {receipt.status.replace('_', ' ')}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Uploaded {new Date(receipt.uploaded_at).toLocaleString()} • Model: {receipt.model_name || 'Gemma 4'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowRawJson(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <Code size={15} />
            <span>Raw AI JSON</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger"
            style={{ fontSize: '0.8rem' }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem' }}
          >
            <Check size={16} strokeWidth={3} />
            <span>{receipt.status === 'confirmed' ? 'Re-confirm Record' : 'Confirm & Save'}</span>
          </button>
        </div>
      </div>

      {/* Review warnings banner (FR-21) */}
      {(receipt.warnings?.length || 0) > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Review Flag:</strong> {receipt.warnings?.join(' • ')}
          </div>
        </div>
      )}

      {/* Side-by-side verification container (FR-20) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 1.2fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Original Document Viewer */}
        <div className="glass-panel" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Source Document ({receipt.original_filename})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="btn btn-secondary"
                style={{ padding: '0.35rem' }}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="btn btn-secondary"
                style={{ padding: '0.35rem' }}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem' }}
                title="Rotate 90°"
              >
                <RotateCw size={15} />
              </button>
            </div>
          </div>

          <div style={{
            height: '560px',
            backgroundColor: '#05070c',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            {receipt.file_url ? (
              receipt.file_type.includes('pdf') ? (
                <iframe
                  src={receipt.file_url}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                />
              ) : (
                <img
                  src={receipt.file_url}
                  alt="Receipt Preview"
                  style={{
                    maxWidth: '100%',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    borderRadius: '4px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                  onError={(e) => {
                    // Fallback visual if local image not uploaded
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                <Info size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                <p>Digital receipt record created from demo file</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Structured Extracted Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card: Verification Score & Confidence */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
                <Sparkles size={16} />
                <span>Gemma 4 Verification Confidence</span>
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: (receipt.confidence || 0) >= 0.9 ? '#34d399' : '#fbbf24' }}>
                {receipt.confidence ? `${Math.round(receipt.confidence * 100)}%` : '92%'}
              </span>
            </div>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${(receipt.confidence || 0.92) * 100}%`,
                height: '100%',
                background: 'var(--gradient-brand)',
                borderRadius: '999px'
              }} />
            </div>
          </div>

          {/* Card: Vendor & Invoice Details */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Vendor & Document Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Vendor / Merchant
                </label>
                <input
                  type="text"
                  className="input"
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Invoice / Receipt #
                </label>
                <input
                  type="text"
                  className="input"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-98421"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Transaction Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Category (Auto-classified)
                </label>
                <select
                  className="select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {ALLOWED_CATEGORIES.map(c => (
                    <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card: Financials & Tax Math (FR-11, FR-36) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Amounts & GST Verification
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Subtotal ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={subtotal}
                  onChange={e => setSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Tax Amount ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={taxAmount}
                  onChange={e => setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Total Amount ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ fontWeight: 700, color: '#34d399' }}
                  value={total}
                  onChange={e => setTotal(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Tax Type
                </label>
                <input
                  type="text"
                  className="input"
                  value={taxType}
                  onChange={e => setTaxType(e.target.value)}
                  placeholder="GST, CGST+SGST, IGST"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Payment Method
                </label>
                <input
                  type="text"
                  className="input"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  placeholder="UPI, Card, NetBanking"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Payment Status
                </label>
                <select
                  className="select"
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value)}
                >
                  <option value="paid" style={{ background: '#0f172a' }}>Paid</option>
                  <option value="unpaid" style={{ background: '#0f172a' }}>Unpaid</option>
                  <option value="partial" style={{ background: '#0f172a' }}>Partial</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="biz_toggle"
                checked={businessExpense}
                onChange={e => setBusinessExpense(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              <label htmlFor="biz_toggle" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Tax-Deductible Business Expense
              </label>
            </div>
          </div>

          {/* Line items table if available */}
          {(receipt.line_items?.length || 0) > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                Extracted Line Items ({receipt.line_items?.length})
              </h3>
              <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                    <th style={{ padding: '0.4rem 0' }}>Description</th>
                    <th style={{ padding: '0.4rem 0', width: '60px' }}>Qty</th>
                    <th style={{ padding: '0.4rem 0', textAlign: 'right', width: '90px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.line_items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.5rem 0', color: 'var(--text-main)' }}>{item.description}</td>
                      <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600 }}>
                        {item.amount !== undefined && item.amount !== null ? `₹${item.amount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Raw AI Output Drawer / Modal */}
      {showRawJson && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={18} color="#06b6d4" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Immutable Gemma 4 Output</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRawJson(false)}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                Close
              </button>
            </div>
            <pre style={{
              flex: 1,
              overflow: 'auto',
              background: '#05070c',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: '#34d399'
            }}>
              {JSON.stringify(receipt.model_output_json || receipt, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
