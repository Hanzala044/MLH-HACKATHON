import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, removeAuthToken, setAuthToken } from '../api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  loginWithClerk: (clerkUser: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clerkPublishableKey: string;
  updateClerkPublishableKey: (key: string) => void;
  isClerkAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [clerkPublishableKey, setClerkPublishableKey] = useState<string>(() => {
    return (
      (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY ||
      localStorage.getItem('clerk_publishable_key') ||
      ''
    );
  });
  const [isClerkAuth, setIsClerkAuth] = useState<boolean>(() => {
    return localStorage.getItem('rw_auth_provider') === 'clerk';
  });

  const updateClerkPublishableKey = (key: string) => {
    const trimmed = key.trim();
    setClerkPublishableKey(trimmed);
    if (trimmed) {
      localStorage.setItem('clerk_publishable_key', trimmed);
    } else {
      localStorage.removeItem('clerk_publishable_key');
    }
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      setUser(null);
      removeAuthToken();
      localStorage.removeItem('rw_auth_provider');
      setIsClerkAuth(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: any) => {
    const res = await api.login(data);
    setAuthToken(res.access_token);
    localStorage.removeItem('rw_auth_provider');
    setIsClerkAuth(false);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setAuthToken(res.access_token);
    localStorage.removeItem('rw_auth_provider');
    setIsClerkAuth(false);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setAuthToken(res.access_token);
    localStorage.removeItem('rw_auth_provider');
    setIsClerkAuth(false);
    setUser(res.user);
  };

  const loginWithClerk = async (clerkUser: any) => {
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      '';
    const fullName =
      clerkUser.fullName ||
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      undefined;

    const res = await api.clerkLogin({
      clerk_id: clerkUser.id,
      email,
      full_name: fullName,
    });
    setAuthToken(res.access_token);
    localStorage.setItem('rw_auth_provider', 'clerk');
    setIsClerkAuth(true);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('rw_auth_provider');
    setIsClerkAuth(false);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        loginWithClerk,
        logout,
        refreshUser,
        clerkPublishableKey,
        updateClerkPublishableKey,
        isClerkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
