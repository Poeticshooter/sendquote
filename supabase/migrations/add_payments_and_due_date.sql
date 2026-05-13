-- Migration: Add due_date to invoices and create payments table
-- Run this in Supabase SQL Editor

-- 1. Add due_date column to invoices (if not exists)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

-- 2. Add spec column to quote_items for specifications
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '';

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create index
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- 5. Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 6. Create policy
CREATE POLICY "Users own their payments"
  ON payments FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));