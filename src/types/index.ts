export type TransactionType = 'income' | 'expense';
export type SyncStatus = 'synced' | 'pending' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  description?: string;
  notes?: string;
  payment_method?: PaymentMethod;
  receipt_url?: string;
  tags?: string[];
  transaction_date: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
  created_at: string;
  sync_status: SyncStatus;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  sync_status: SyncStatus;
}

export interface SyncQueueItem {
  id: string;
  user_id: string;
  action_type: 'create' | 'update' | 'delete';
  table_name: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retry_count: number;
  created_at: string;
}

export interface DashboardStats {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface BudgetWithCategory extends Budget {
  category: Category;
  spent: number;
  percentage: number;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}
