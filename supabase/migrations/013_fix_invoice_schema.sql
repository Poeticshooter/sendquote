-- Migration 013: Fix invoice schema — add invoice_items table and missing invoices columns
-- This ensures the invoices table matches what the TypeScript code expects.

-- ============================================
-- PART 1: Add missing columns to invoices table
-- ============================================
-- All columns are nullable or have defaults so existing rows are unaffected.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2) DEFAULT 0;

-- Backfill: for existing invoices, set subtotal/total from amount column if present
UPDATE invoices SET subtotal = amount WHERE subtotal = 0 AND amount > 0;
UPDATE invoices SET discount = 0 WHERE discount IS NULL;
UPDATE invoices SET gst_amount = 0 WHERE gst_amount IS NULL;
UPDATE invoices SET paid_amount = 0 WHERE paid_amount IS NULL;
UPDATE invoices SET balance_due = COALESCE(amount, 0) - COALESCE(paid_amount, 0) WHERE balance_due = 0;

-- ============================================
-- PART 2: Create invoice_items table
-- ============================================
-- Mirrors quote_items structure but references invoices instead.

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  spec TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'nos',
  rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort ON invoice_items(invoice_id, sort_order);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Users can manage line items only for their own invoices
DROP POLICY IF EXISTS "Users can manage own invoice items" ON invoice_items;
CREATE POLICY "Users can manage own invoice items" ON invoice_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );

-- ============================================
-- PART 3: Trigger to auto-calculate balance_due on invoices
-- ============================================
CREATE OR REPLACE FUNCTION calc_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Sum all payments for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO NEW.paid_amount
  FROM payments
  WHERE invoice_id = NEW.invoice_id;

  -- Calculate balance: total - paid
  NEW.balance_due := COALESCE(NEW.total, NEW.subtotal, 0) - NEW.paid_amount;

  -- Auto-update status based on balance
  IF NEW.balance_due <= 0 AND NEW.paid_amount > 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.due_date < NOW() AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_balance ON invoices;
CREATE TRIGGER trg_invoice_balance
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calc_invoice_balance();

-- ============================================
-- PART 4: RPC — create_invoice_from_quote
-- ============================================
-- Creates an invoice from an accepted quote, copying all line items.
-- Returns the new invoice ID.
-- SECURITY DEFINER so it can be called from API routes with service role.

CREATE OR REPLACE FUNCTION create_invoice_from_quote(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_item RECORD;
  v_profile RECORD;
BEGIN
  -- Fetch the quote
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Generate invoice number from profile counter
  SELECT * INTO v_profile FROM profiles WHERE user_id = v_quote.user_id;
  v_invoice_number := 'INV-' || LPAD(COALESCE(v_profile.invoice_counter, 0) + 1::TEXT, 4, '0');

  -- Create invoice
  INSERT INTO invoices (
    user_id, quote_id, invoice_number,
    client_name, client_email, client_phone, client_address,
    subtotal, discount, discount_type, gst_rate, gst_amount,
    total, paid_amount, balance_due,
    terms, notes, payment_terms,
    due_date, status
  ) VALUES (
    v_quote.user_id,
    v_quote.id,
    v_invoice_number,
    v_quote.client_name,
    v_quote.client_email,
    v_quote.client_phone,
    v_quote.client_address,
    v_quote.subtotal,
    v_quote.discount,
    v_quote.discount_type,
    v_quote.gst_rate,
    v_quote.gst_amount,
    v_quote.total,
    0,
    v_quote.total,
    v_quote.terms,
    v_quote.notes,
    v_quote.payment_terms,
    NOW() + INTERVAL '30 days',
    'pending'
  ) RETURNING id INTO v_invoice_id;

  -- Copy line items from quote_items to invoice_items
  FOR v_item IN
    SELECT description, spec, quantity, unit, rate, amount, sort_order
    FROM quote_items
    WHERE quote_id = p_quote_id
    ORDER BY sort_order
  LOOP
    INSERT INTO invoice_items (
      invoice_id, description, spec, quantity, unit, rate, amount, sort_order
    ) VALUES (
      v_invoice_id, v_item.description, v_item.spec, v_item.quantity,
      v_item.unit, v_item.rate, v_item.amount, v_item.sort_order
    );
  END LOOP;

  -- Increment invoice counter
  UPDATE profiles SET invoice_counter = COALESCE(invoice_counter, 0) + 1
  WHERE user_id = v_quote.user_id;

  -- Update quote status
  UPDATE quotes SET status = 'accepted' WHERE id = p_quote_id;

  RETURN v_invoice_id;
END;
$$;
