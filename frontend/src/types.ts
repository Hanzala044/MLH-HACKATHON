export interface User {
  id: string;
  email: string;
  full_name?: string;
  default_currency: string;
  country: string;
  model_mode: 'cloud' | 'local';
}

export interface LineItem {
  description: string;
  quantity?: number | null;
  amount?: number | null;
}

export interface Receipt {
  id: string;
  file_key: string;
  file_type: string;
  original_filename: string;
  user_note?: string | null;
  status: 'queued' | 'processing' | 'ready' | 'needs_review' | 'failed' | 'confirmed';
  error_message?: string | null;
  model_name?: string | null;
  model_mode?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
  confirmed_at?: string | null;
  file_url?: string | null;

  // Extracted data
  document_type?: string | null;
  vendor?: string | null;
  invoice_number?: string | null;
  receipt_date?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  tax_type?: string | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total?: number | null;
  payment_method?: string | null;
  payment_status?: string | null;
  category?: string | null;
  business_expense?: boolean | null;
  line_items?: LineItem[];
  confidence?: number | null;
  completeness_score?: number | null;
  needs_review?: boolean | null;
  review_reason?: string | null;
  warnings?: string[];
  model_output_json?: any;
}

export interface DashboardData {
  month_total: number;
  tax_total: number;
  unpaid_total: number;
  needs_review_count: number;
  receipt_count: number;
  confirmed_count: number;
  category_breakdown: { category: string; total: number; percentage: number; count: number }[];
  monthly_trend: { month: string; total: number; tax: number }[];
  recent_receipts: Receipt[];
}
