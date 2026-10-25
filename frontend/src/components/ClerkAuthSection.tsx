import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { KeyRound, Shield, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import { useClerkConfig } from '../context/ClerkWrapper';

export const ClerkAuthSection: React.FC<{ onClerkSuccess?: () => void }> = () => {
  const { isClerkConfigured, publishableKey, setPublishableKey, removePublishableKey } = useClerkConfig();
  const [inputKey, setInputKey] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) {
      setError('Key must start with "pk_test_" or "pk_live_"');
      return;
    }
    setError(null);
    setPublishableKey(trimmed);
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (!isClerkConfigured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <Shield size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Clerk Authentication
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                Google OAuth, GitHub, Magic Links, Passkeys & 2FA
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0.75rem 0 1rem' }}>
            Connect your Clerk publishable key to unlock official Clerk identity management with automatic ReceiptWise token generation.
          </p>

          <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Clerk Publishable Key
              </label>
              <input
                type="text"
                className="input"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError(null);
                }}
                placeholder="pk_test_..."
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </div>

            {error && (
              <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
                {error}
              </div>
            )}

            {saveSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#34d399' }}>
                <CheckCircle2 size={14} />
                <span>Clerk key connected! Initializing Clerk...</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.65rem'
              }}
            >
              <KeyRound size={16} />
              <span>Connect & Launch Clerk</span>
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Need a Clerk API key?</span>
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 600 }}
            >
              <span>Get free key</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        fontSize: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8' }}>
          <Sparkles size={14} />
          <span>Clerk Connected ({publishableKey.slice(0, 12)}...)</span>
        </div>
        <button
          type="button"
          onClick={() => {
            removePublishableKey();
            window.location.reload();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.72rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Change Key
        </button>
      </div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        {isSignUp ? (
          <SignUp
            routing="virtual"
            signInUrl="/login"
            fallbackRedirectUrl="/"
          />
        ) : (
          <SignIn
            routing="virtual"
            signUpUrl="/register"
            fallbackRedirectUrl="/"
          />
        )}
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Sign In with Clerk' : 'Create Account with Clerk'}
        </button>
      </div>
    </div>
  );
};
