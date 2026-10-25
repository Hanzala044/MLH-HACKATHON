import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Trash2, 
  RefreshCw, 
  Database 
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [country, setCountry] = useState('IN');
  const [modelMode, setModelMode] = useState<'cloud' | 'local'>('cloud');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Model test state
  const [testingModel, setTestingModel] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Database info state
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCurrency(user.default_currency || 'INR');
      setCountry(user.country || 'IN');
      setModelMode(user.model_mode || 'cloud');
    }
  }, [user]);

  useEffect(() => {
    fetchDbInfo();
  }, []);

  const fetchDbInfo = () => {
    setLoadingDb(true);
    api.getDatabaseInfo()
      .then(res => setDbInfo(res))
      .catch(err => setDbInfo({ status: 'offline', error: err.message }))
      .finally(() => setLoadingDb(false));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.updateSettings({
        full_name: fullName,
        default_currency: currency,
        country,
        model_mode: modelMode
      });
      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingModel(true);
    setTestResult(null);
    try {
      const res = await api.testModel(modelMode);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ status: 'error', message: err.message || 'Connection test failed' });
    } finally {
      setTestingModel(false);
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm('Are you sure you want to PERMANENTLY erase all your receipts and parsed financial data? This cannot be undone.')) {
      return;
    }
    try {
      const res = await api.deleteAllData();
      alert(res.message);
      window.location.reload();
    } catch (err: any) {
      alert(`Purge failed: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-main)' }}>
          Settings & Infrastructure
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Manage your Supabase database connection, AI inference engines, and workspace preferences
        </p>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          background: statusMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
          border: `1px solid ${statusMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
          color: statusMsg.type === 'success' ? '#166534' : '#B91C1C',
          fontSize: '0.825rem',
          fontWeight: 700
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* =========================================================================
          BENTO CARD 1: SUPABASE MANAGED DATABASE (Matching warm bento aesthetic)
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--accent-yellow)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Supabase PostgreSQL Backend
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                High-availability relational database storing receipts, line items, and audit logs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`status-pill ${dbInfo?.status === 'connected' ? 'status-pill-confirmed' : 'status-pill-rescheduled'}`}>
              ● {dbInfo?.status === 'connected' ? 'Connected' : 'Checking'}
            </span>
            <button
              type="button"
              onClick={fetchDbInfo}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              title="Refresh DB status"
            >
              <RefreshCw size={13} className={loadingDb ? 'pulse-indicator' : ''} />
            </button>
          </div>
        </div>

        {/* Database specs bento strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <div className="bento-card-subtle" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Engine</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {dbInfo?.provider || 'Supabase PostgreSQL 16'}
            </div>
          </div>

          <div className="bento-card-subtle" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Host Endpoint</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dbInfo?.host || 'localhost:5432'}
            </div>
          </div>

          <div className="bento-card-subtle" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Port / Mode</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {dbInfo?.pooler_port || '6543 (Pooler)'}
            </div>
          </div>

          <div className="bento-card-subtle" style={{ padding: '0.85rem 1rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Records Stored</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {dbInfo?.receipt_count ?? 0} receipts • {dbInfo?.user_count ?? 0} users
            </div>
          </div>
        </div>

        {/* Supabase Connection Setup Guide */}
        <div style={{
          padding: '1.15rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.825rem'
        }}>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚡ How to Connect Your Own Supabase Project:</span>
          </div>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <li>Go to your <strong>Supabase Dashboard</strong> → <strong>Project Settings</strong> → <strong>Database</strong>.</li>
            <li>Under <strong>Connection string</strong>, select <strong>URI</strong> (Connection pooling port <code>6543</code> or Direct <code>5432</code>).</li>
            <li>In <code>backend/.env</code>, set: 
              <pre style={{
                margin: '0.4rem 0',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                color: 'var(--text-main)',
                overflowX: 'auto'
              }}>
DATABASE_URL=postgresql+psycopg2://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
              </pre>
            </li>
            <li>The server automatically executes schema migrations (tables, audit logs, line items) on boot.</li>
          </ol>
        </div>
      </div>

      {/* =========================================================================
          BENTO CARD 2: PROFILE & PREFERENCES
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Profile & Currency Settings
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Asha Patel"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Default Currency
              </label>
              <select
                className="select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <option value="INR">INR (₹) - Indian Rupee (GST Enabled)</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro (VAT Enabled)</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Tax Jurisdiction
              </label>
              <select
                className="select"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                <option value="IN">India (CGST + SGST + IGST)</option>
                <option value="US">United States (Sales Tax)</option>
                <option value="EU">European Union (Standard VAT)</option>
                <option value="UK">United Kingdom (UK VAT)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-black"
              style={{ padding: '0.65rem 1.75rem', fontWeight: 700 }}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================================
          BENTO CARD 3: AI INFERENCE ENGINE (Gemma 4 / DeepMind Cloud / Ollama)
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          AI Inference & Privacy Mode
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
          Toggle between zero-data-retention DeepMind Cloud API or 100% on-device air-gapped local inference.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            onClick={() => setModelMode('cloud')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: modelMode === 'cloud' ? '2px solid var(--accent-black)' : '1px solid var(--border-color)',
              background: modelMode === 'cloud' ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Cloud DeepMind API
              </span>
              {modelMode === 'cloud' && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-black)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                  ✓
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              Gemma 4 31B IT running in high-speed cloud container. 0-day data retention agreement.
            </p>
          </div>

          <div
            onClick={() => setModelMode('local')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: modelMode === 'local' ? '2px solid var(--accent-black)' : '1px solid var(--border-color)',
              background: modelMode === 'local' ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Local Ollama / Air-Gapped
              </span>
              {modelMode === 'local' && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-black)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                  ✓
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              Gemma 4 e4b / 2b running directly on your laptop via Ollama. No bytes leave your machine.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testingModel}
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1.15rem', fontWeight: 600 }}
        >
          {testingModel ? (
            <>
              <RefreshCw size={14} className="pulse-indicator" />
              <span>Testing Connection...</span>
            </>
          ) : (
            <>
              <Cpu size={14} />
              <span>Test Current Model Health</span>
            </>
          )}
        </button>

        {testResult && (
          <div style={{
            marginTop: '0.85rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: testResult.status === 'success' ? '#DCFCE7' : testResult.status === 'warning' ? '#FEF3C7' : '#FEE2E2',
            color: testResult.status === 'success' ? '#166534' : testResult.status === 'warning' ? '#B45309' : '#B91C1C',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* =========================================================================
          BENTO CARD 4: PERMANENT DATA PURGE (GDPR / Privacy Flow E)
      ========================================================================== */}
      <div className="bento-card" style={{ padding: '1.75rem', border: '1px solid #FCA5A5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', margin: 0 }}>
              Permanent Data Deletion (Flow E)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.25rem', margin: 0 }}>
              Instantly purge all receipt images, OCR extracts, and financial records from Supabase and storage.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteData}
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Trash2 size={15} />
            <span>Purge All Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
