-- ExpenseFlow Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  notes TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')),
  receipt_url TEXT,
  tags TEXT[],
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Sync queue (for tracking failed syncs server-side)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  table_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'failed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_category ON transactions(user_id, category_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(user_id, type);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_period ON budgets(user_id, month, year);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Sync queue policies
CREATE POLICY "Users can manage own sync queue"
  ON sync_queue FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
