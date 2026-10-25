import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Camera, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import type { Receipt } from '../types';

export const Upload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedReceipts, setUploadedReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (files.length + acceptedFiles.length > 10) {
      setError('Maximum 10 files allowed per upload batch.');
      return;
    }
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024,
    onDropRejected: () => setError('Files must be JPG, PNG, WEBP or PDF and under 10MB.')
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (note.trim()) formData.append('note', note.trim());

    try {
      const res = await api.uploadReceipts(formData);
      setUploadedReceipts(res);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Live polling for processing files
  useEffect(() => {
    const hasPending = uploadedReceipts.some(r => r.status === 'queued' || r.status === 'processing');
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getReceipts();
        const idSet = new Set(uploadedReceipts.map(r => r.id));
        const relevant = updated.filter(r => idSet.has(r.id));
        setUploadedReceipts(relevant);
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [uploadedReceipts]);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Capture & Upload Receipts
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Drop photos, PDFs or WhatsApp payment screenshots for instant Gemma 4 structured extraction
        </p>
      </div>

      {/* Processing Location Banner (FR-44) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        marginBottom: '1.5rem',
        fontSize: '0.8rem',
        color: '#34d399'
      }}>
        <ShieldCheck size={20} color="#10b981" />
        <div>
          <strong>Processing Security:</strong> Using Google DeepMind Gemma 4 with zero permanent cloud storage retention. Your documents remain private and tax-ready.
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: '#f87171',
          fontSize: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: isDragActive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(18, 24, 38, 0.5)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '1.5rem'
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <UploadCloud size={32} />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          {isDragActive ? 'Drop your files here...' : 'Drag & drop receipts, or browse'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
          Supports JPG, PNG, WEBP and PDF invoices up to 10MB each (batch of up to 10 files).
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={e => e.stopPropagation()}>
            <FileText size={16} />
            <span>Select Files</span>
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
            <Camera size={16} />
            <span>Take Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files) onDrop(Array.from(e.target.files));
              }}
            />
          </label>
        </div>
      </div>

      {/* Selected file preview list */}
      {files.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Selected Files ({files.length}/10)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={16} color="#06b6d4" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({(f.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Optional Context Note (e.g. "Client lunch in Udupi", "Annual AWS subscription")
            </label>
            <input
              type="text"
              className="input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add context to assist Gemma 4 categorization..."
            />
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {uploading ? (
              <>
                <RefreshCw size={16} className="pulse-indicator" />
                <span>Uploading & Starting Gemma 4 Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Start AI Extraction ({files.length} {files.length === 1 ? 'file' : 'files'})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Batch Extraction Status Cards */}
      {uploadedReceipts.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Extraction Pipeline</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Auto-updating every 2s
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {uploadedReceipts.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} color="#94a3b8" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {r.vendor || r.original_filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {r.receipt_date ? `${r.receipt_date} • ` : ''}
                      {r.total ? `${r.currency || '₹'} ${r.total.toFixed(2)}` : 'Extracting fields...'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${r.status}`}>
                    {r.status === 'processing' && <RefreshCw size={12} className="pulse-indicator" />}
                    {r.status === 'ready' && <CheckCircle size={12} />}
                    {r.status === 'needs_review' && <AlertTriangle size={12} />}
                    <span>{r.status.replace('_', ' ')}</span>
                  </span>

                  {(r.status === 'ready' || r.status === 'needs_review' || r.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => navigate(`/receipts/${r.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                    >
                      <span>Review</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
