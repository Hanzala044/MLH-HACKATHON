import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { ReceiptReview } from './pages/ReceiptReview';
import { Ledger } from './pages/Ledger';
import { ReviewQueue } from './pages/ReviewQueue';
import { GstSummary } from './pages/GstSummary';
import { AskGemma } from './pages/AskGemma';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

import { ClerkWrapper } from './context/ClerkWrapper';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/receipts/:id" element={<ReceiptReview />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/review" element={<ReviewQueue />} />
          <Route path="/gst" element={<GstSummary />} />
          <Route path="/ask" element={<AskGemma />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ClerkWrapper>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </ClerkWrapper>
    </AuthProvider>
  );
}
