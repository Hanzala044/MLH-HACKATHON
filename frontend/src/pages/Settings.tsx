import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Trash2, 
  Check, 
  RefreshCw, 
  Sliders
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

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCurrency(user.default_currency || 'INR');
      setCountry(user.country || 'IN');
      setModelMode(user.model_mode || 'cloud');
    }
  }, [user]);

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
      setTestResult({ status: 'error', message: err.message });
    } finally {
      setTestingModel(false);
    }
  };

  const handleDeleteAll = async () => {
    const promptMsg = 'Type "DELETE" to permanently wipe all stored receipts, images, and ledger rows.';
    const input = window.prompt(promptMsg);
    if (input !== 'DELETE') return;

    try {
      const res = await api.deleteAllData();
      alert(res.message);
      window.location.href = '/';
    } catch (err: any) {
      alert(`Wipe failed: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Preferences & Privacy Controls
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Configure AI inference mode, currency preferences, and self-hosted privacy options
        </p>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Model Mode Selection (FR-43) */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Cpu size={18} color="#10b981" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Inference Engine (Gemma 4)</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Select between Google DeepMind cloud API or completely self-hosted local inference with Ollama.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            onClick={() => setModelMode('cloud')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: modelMode === 'cloud' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `2px solid ${modelMode === 'cloud' ? '#10b981' : 'var(--border-color)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cloud Gemma 4 (API)</span>
              {modelMode === 'cloud' && <Check size={16} color="#10b981" />}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Uses Google Gemini / Gemma 4 cloud endpoint. Ultra-fast (&lt;5s), high multimodal precision, zero local hardware requirements.
            </p>
          </div>

          <div
            onClick={() => setModelMode('local')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: modelMode === 'local' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `2px solid ${modelMode === 'local' ? '#06b6d4' : 'var(--border-color)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Local Gemma 4 (Ollama)</span>
              {modelMode === 'local' && <Check size={16} color="#06b6d4" />}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              100% air-gapped on your own machine. Documents and receipts never leave localhost (`http://localhost:11434`).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testingModel}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem' }}
        >
          {testingModel ? <RefreshCw size={14} className="pulse-indicator" /> : <Sliders size={14} />}
          <span>Test {modelMode === 'cloud' ? 'Cloud' : 'Local'} Connection</span>
        </button>

        {testResult && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            background: testResult.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: testResult.status === 'success' ? '#34d399' : '#fbbf24',
            border: `1px solid ${testResult.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
          }}>
            {testResult.message}
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Profile & Regional Defaults</h2>
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Default Currency
              </label>
              <select
                className="select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <option value="INR" style={{ background: '#0f172a' }}>INR (₹) - Indian Rupee</option>
                <option value="USD" style={{ background: '#0f172a' }}>USD ($) - US Dollar</option>
                <option value="EUR" style={{ background: '#0f172a' }}>EUR (€) - Euro</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Tax Country
              </label>
              <select
                className="select"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                <option value="IN" style={{ background: '#0f172a' }}>India (GST Compliant)</option>
                <option value="US" style={{ background: '#0f172a' }}>United States</option>
                <option value="EU" style={{ background: '#0f172a' }}>European Union</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ width: 'fit-content', marginTop: '0.5rem' }}
          >
            <Check size={16} />
            <span>Save Preferences</span>
          </button>
        </form>
      </div>

      {/* Destructive Privacy Controls (FR-41, Flow E) */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Trash2 size={18} color="#f43f5e" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f43f5e' }}>Permanent Data Deletion</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Instantly purge all stored documents, extracted financial line items, and database records. This cannot be undone.
        </p>

        <button
          type="button"
          onClick={handleDeleteAll}
          className="btn btn-danger"
          style={{ fontSize: '0.85rem' }}
        >
          <Trash2 size={15} />
          <span>Purge All My Data Permanently</span>
        </button>
      </div>
    </div>
  );
};
