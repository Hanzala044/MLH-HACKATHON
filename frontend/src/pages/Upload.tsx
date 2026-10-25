import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Camera, 
  Sparkles,
  ArrowRight,
  Database,
  Trash2
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
        const fresh = await api.getReceipts();
        setUploadedReceipts(prev =>
          prev.map(p => fresh.find(f => f.id === p.id) || p)
        );
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [uploadedReceipts]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
            Upload Receipts & Invoices
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Multi-modal ingestion pipeline stored directly in your Supabase backend
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-yellow)',
          color: '#000000',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          <Database size={14} />
          <span>Supabase PostgreSQL Storage Enabled</span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#B91C1C',
          fontSize: '0.825rem',
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {/* Drag & Drop Bento Card */}
      <div
        {...getRootProps()}
        className="bento-card"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          border: isDragActive ? '2px dashed var(--accent-black)' : '2px dashed rgba(0, 0, 0, 0.12)',
          backgroundColor: isDragActive ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
          transition: 'all 0.2s ease'
        }}
      >
        <input {...getInputProps()} />

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-bento)'
        }}>
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
          {isDragActive ? 'Drop receipts right here...' : 'Drag & drop receipts, or browse files'}
        </h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
          Supports JPG, PNG, WEBP and PDF invoices up to 10MB each (batch of up to 10 receipts).
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
        <div className="bento-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Selected Files ({files.length}/10)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Ready for extraction
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <FileText size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    ({(f.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.35rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Optional Context Note (e.g. "Client lunch in Udupi", "Monthly cloud droplet")
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
            className="btn btn-black"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 800 }}
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
        <div className="bento-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Extraction Pipeline
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Auto-updating via Supabase backend
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
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText size={20} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {r.vendor || r.original_filename}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                      {r.receipt_date ? `${r.receipt_date} • ` : ''}
                      {r.total ? `${r.currency || '₹'} ${r.total.toFixed(2)}` : 'Gemma 4 processing in background...'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`status-pill ${
                    r.status === 'confirmed' ? 'status-pill-confirmed' :
                    r.status === 'needs_review' ? 'status-pill-rescheduled' :
                    r.status === 'processing' ? 'status-pill-waiting' : 'status-pill-scheduled'
                  }`}>
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
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 700 }}
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
