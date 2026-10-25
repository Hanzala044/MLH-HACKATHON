import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClerkProvider, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useAuth } from './AuthContext';

interface ClerkConfigContextType {
  publishableKey: string;
  isClerkConfigured: boolean;
  setPublishableKey: (key: string) => void;
  removePublishableKey: () => void;
}

const ClerkConfigContext = createContext<ClerkConfigContextType>({
  publishableKey: '',
  isClerkConfigured: false,
  setPublishableKey: () => {},
  removePublishableKey: () => {},
});

export const useClerkConfig = () => useContext(ClerkConfigContext);

// Component that runs inside ClerkProvider to sync Clerk session with ReceiptWise backend
export const ClerkSessionSync: React.FC = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { user: rwUser, loginWithClerk } = useAuth();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !rwUser && !syncing) {
      setSyncing(true);
      loginWithClerk(user)
        .catch((err) => {
          console.error('Failed to sync Clerk user with ReceiptWise:', err);
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [isLoaded, isSignedIn, user, rwUser, syncing, loginWithClerk]);

  return null;
};

export const ClerkWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publishableKey, setKey] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ||
      localStorage.getItem('clerk_publishable_key') ||
      ''
    );
  });

  const setPublishableKey = (key: string) => {
    const trimmed = key.trim();
    setKey(trimmed);
    if (trimmed) {
      localStorage.setItem('clerk_publishable_key', trimmed);
    } else {
      localStorage.removeItem('clerk_publishable_key');
    }
  };

  const removePublishableKey = () => {
    setKey('');
    localStorage.removeItem('clerk_publishable_key');
  };

  const isClerkConfigured = Boolean(
    publishableKey && (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_'))
  );

  const contextValue: ClerkConfigContextType = {
    publishableKey,
    isClerkConfigured,
    setPublishableKey,
    removePublishableKey,
  };

  if (!isClerkConfigured) {
    return (
      <ClerkConfigContext.Provider value={contextValue}>
        {children}
      </ClerkConfigContext.Provider>
    );
  }

  return (
    <ClerkConfigContext.Provider value={contextValue}>
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#10b981',
            colorBackground: '#0b1322',
            colorText: '#f1f5f9',
            colorTextSecondary: '#94a3b8',
            colorInputBackground: '#131e33',
            colorInputText: '#f8fafc',
            borderRadius: '0.75rem',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          elements: {
            card: {
              backgroundColor: '#0c1526',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            },
            headerTitle: {
              color: '#f8fafc',
              fontWeight: 800,
            },
            formButtonPrimary: {
              backgroundColor: '#10b981',
              color: '#022c22',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#34d399',
              },
            },
            socialButtonsBlockButton: {
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
              },
            },
          },
        }}
      >
        <ClerkSessionSync />
        {children}
      </ClerkProvider>
    </ClerkConfigContext.Provider>
  );
};
