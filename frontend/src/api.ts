import type { DashboardData, Receipt, User } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('rw_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('rw_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('rw_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/demo')) {
    removeAuthToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'An unexpected error occurred');
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

export const api = {
  // Auth
  register: (data: any) => request<{ access_token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ access_token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: () => request<{ access_token: string; user: User }>('/auth/demo', { method: 'POST' }),
  clerkLogin: (data: { clerk_id: string; email: string; full_name?: string }) => request<{ access_token: string; user: User }>('/auth/clerk', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<User>('/auth/me'),

  // Receipts
  uploadReceipts: (formData: FormData) => request<Receipt[]>('/receipts', { method: 'POST', body: formData }),
  getReceipts: (status?: string) => request<Receipt[]>(`/receipts${status ? `?status=${status}` : ''}`),
  getReceipt: (id: string) => request<Receipt>(`/receipts/${id}`),
  updateReceipt: (id: string, data: any) => request<Receipt>(`/receipts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  confirmReceipt: (id: string) => request<Receipt>(`/receipts/${id}/confirm`, { method: 'POST' }),
  retryReceipt: (id: string) => request<Receipt>(`/receipts/${id}/retry`, { method: 'POST' }),
  deleteReceipt: (id: string) => request<{ message: string }>(`/receipts/${id}`, { method: 'DELETE' }),

  // Ledger & Export
  getLedger: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
    });
    return request<{ items: Receipt[]; page: number; page_size: number; total_items: number }>(`/ledger?${query.toString()}`);
  },
  exportCsvUrl: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
    });
    const token = getAuthToken();
    return `${API_BASE}/export/csv?${query.toString()}${token ? `&token=${token}` : ''}`;
  },

  // Dashboard
  getDashboard: (month?: string) => request<DashboardData>(`/dashboard${month ? `?month=${month}` : ''}`),

  // Review Queue
  getReviewQueue: () => request<{ needs_review: Receipt[]; duplicates: Receipt[]; gst_warnings: Receipt[]; low_confidence: Receipt[]; total_flagged: number }>('/review-queue'),

  // GST
  getGstSummary: (month?: string) => request<any>(`/gst${month ? `?month=${month}` : ''}`),

  // Ask Gemma
  ask: (question: string) => request<{ answer: string; cited_receipts: Receipt[]; filters_used: any }>('/ask', { method: 'POST', body: JSON.stringify({ question }) }),

  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  testModel: (mode: string) => request<any>(`/settings/test-model?mode=${mode}`, { method: 'POST' }),
  deleteAllData: () => request<{ message: string }>('/settings/data', { method: 'DELETE' }),
};
