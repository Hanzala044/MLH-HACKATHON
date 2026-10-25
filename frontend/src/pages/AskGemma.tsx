import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileCheck2
} from 'lucide-react';
import { api } from '../api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citedReceipts?: any[];
  filtersUsed?: any;
}

const SUGGESTIONS = [
  'How much did I spend on Software and Cloud in October?',
  'List all my unpaid invoices and their due totals.',
  'What was my total GST paid on travel this month?',
  'Show all dining and meal expenses above ₹500.'
];

export const AskGemma: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Gemma 4 financial assistant. You can ask me natural language questions about your confirmed receipts, taxes, vendors, and spending patterns.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await api.ask(q);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          citedReceipts: res.cited_receipts,
          filtersUsed: res.filters_used
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to process query: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <Sparkles size={20} color="#10b981" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Ask Your Receipts
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Natural language intelligence over confirmed receipts, citing verified invoice IDs
        </p>
      </div>

      {/* Suggested chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(s)}
            disabled={loading}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {m.role === 'assistant' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-brand)',
                color: '#022c22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={18} />
              </div>
            )}

            <div style={{
              background: m.role === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${m.role === 'user' ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.1rem',
              fontSize: '0.875rem',
              lineHeight: 1.5
            }}>
              <div>{m.content}</div>

              {/* Cited Receipts */}
              {m.citedReceipts && m.citedReceipts.length > 0 && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    CITED AUDIT RECORDS:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {m.citedReceipts.map((r: any, rIdx: number) => (
                      <Link
                        key={rIdx}
                        to={`/receipts/${r.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(6, 182, 212, 0.12)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: '#38bdf8',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <FileCheck2 size={12} />
                        <span>{r.vendor || 'Receipt'}: ₹{r.total || '0'}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Gemma 4 is inspecting verified ledger rows...</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(input); }}
        style={{ display: 'flex', gap: '0.75rem' }}
      >
        <input
          type="text"
          className="input"
          placeholder="Ask a question about your taxes, vendors, or expenses..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem' }}
        >
          <Send size={16} />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
