import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Sparkles, KeyRound, Lock, Mail, User, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClerkAuthSection } from '../components/ClerkAuthSection';
import { useClerkConfig } from '../context/ClerkWrapper';

type TabMode = 'demo' | 'clerk' | 'email';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('demo');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, demoLogin } = useAuth();
  const { isClerkConfigured } = useClerkConfig();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName });
      } else {
        await login({ email, password });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Could not load demo account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18), transparent 45%), radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.15), transparent 50%), radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08), transparent 60%), #070c18',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient decorative grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: activeTab === 'clerk' && isClerkConfigured ? '520px' : '460px',
        padding: '2.5rem',
        borderRadius: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(13, 21, 38, 0.85)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.1)',
        position: 'relative',
        zIndex: 10,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#022c22',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
            marginBottom: '1rem',
          }}>
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
            Receipt<span style={{
              background: 'linear-gradient(135deg, #34d399, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Wise</span>
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontSize: '0.72rem',
            fontWeight: 600,
            marginTop: '0.5rem'
          }}>
            <Sparkles size={12} />
            <span>Privacy-First • Powered by Gemma 4</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.35rem',
          padding: '0.3rem',
          borderRadius: '0.75rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '1.75rem'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); setError(null); }}
            style={{
              padding: '0.55rem 0.4rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: activeTab === 'demo' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.2))' : 'transparent',
              color: activeTab === 'demo' ? '#34d399' : 'var(--text-muted)',
              borderBottom: activeTab === 'demo' ? '2px solid #10b981' : '2px solid transparent',
              fontWeight: activeTab === 'demo' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={14} />
            <span>Judge Demo</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('clerk'); setError(null); }}
            style={{
              padding: '0.55rem 0.4rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: activeTab === 'clerk' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(16, 185, 129, 0.15))' : 'transparent',
              color: activeTab === 'clerk' ? '#a5b4fc' : 'var(--text-muted)',
              borderBottom: activeTab === 'clerk' ? '2px solid #818cf8' : '2px solid transparent',
              fontWeight: activeTab === 'clerk' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={14} />
            <span>Clerk Auth</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('email'); setError(null); }}
            style={{
              padding: '0.55rem 0.4rem',
              borderRadius: '0.55rem',
              border: 'none',
              background: activeTab === 'email' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: activeTab === 'email' ? '#f8fafc' : 'var(--text-muted)',
              borderBottom: activeTab === 'email' ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === 'email' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Mail size={14} />
            <span>Email</span>
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#f87171',
            fontSize: '0.8rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tab 1: Demo Walkthrough */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.09) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '1.35rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <Sparkles size={18} />
                <span>Instant Hackathon Judge Access</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                Pre-configured freelancer persona (Asha) with real-world receipt scans, OCR extracts, and GST breakdowns ready for evaluation.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>Uber India ride from Udupi Railway Station (CGST/SGST 5%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>DigitalOcean Cloud Hosting Monthly Droplet (VAT 18%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>GitHub Copilot Individual Subscription ($10 USD)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span>Flagged Review Queue receipt for Human-in-the-loop review</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemoClick}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  fontSize: '0.92rem',
                  padding: '0.8rem',
                  fontWeight: 800,
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <div style={{ width: '18px', height: '18px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <KeyRound size={18} />
                    <span>Launch 1-Click Demo Account</span>
                  </>
                )}
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              No password or external setup needed. Evaluates full end-to-end functionality.
            </div>
          </div>
        )}

        {/* Tab 2: Clerk Authentication */}
        {activeTab === 'clerk' && (
          <ClerkAuthSection />
        )}

        {/* Tab 3: Native Email/Password */}
        {activeTab === 'email' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <User size={13} />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  className="input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Asha Patel"
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Mail size={13} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="asha@example.com"
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Lock size={13} />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '0.5rem',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <div style={{ width: '18px', height: '18px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
