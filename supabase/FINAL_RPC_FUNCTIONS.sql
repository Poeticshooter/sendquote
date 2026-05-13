-- =============================================
-- QuoteSend - Supabase SQL Setup
-- Paste this entire file in Supabase SQL Editor
-- =============================================

-- 1. Add missing columns to existing tables (safe to run even if they exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_counter INT NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '';

-- 2. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on waitlist" ON waitlist;
CREATE POLICY "Allow public insert on waitlist" ON waitlist FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow users to read own waitlist entry" ON waitlist;
CREATE POLICY "Allow users to read own waitlist entry" ON waitlist FOR SELECT USING (true);

-- 3. Drop old RPC functions (ignore errors if they don't exist)
DROP FUNCTION IF EXISTS get_quote_admin(UUID);
DROP FUNCTION IF EXISTS get_profile_admin(UUID);
DROP FUNCTION IF EXISTS get_quote_items(UUID);
DROP FUNCTION IF EXISTS record_quote_action(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS track_quote_open(TEXT);
DROP FUNCTION IF EXISTS get_quote_by_token(TEXT);
DROP FUNCTION IF EXISTS create_invoice_from_quote(UUID);
DROP FUNCTION IF EXISTS get_invoice_admin(UUID);
DROP FUNCTION IF EXISTS get_invoice_items(UUID);

-- 4. Create all RPC functions

-- Get quote by public token (for /q/[token] public page)
CREATE OR REPLACE FUNCTION get_quote_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID, quote_number TEXT, client_name TEXT, client_email TEXT, client_phone TEXT,
  client_address TEXT, valid_till DATE, status TEXT, subtotal NUMERIC, discount NUMERIC,
  discount_type TEXT, gst_rate NUMERIC, gst_amount NUMERIC, total NUMERIC, notes TEXT,
  terms TEXT, payment_terms TEXT, unique_token TEXT, created_at TIMESTAMPTZ,
  sender_email TEXT, sender_phone TEXT, sender_gst TEXT, sender_address TEXT,
  business_name TEXT, logo_url TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT q.id, q.quote_number, q.client_name, q.client_email, q.client_phone,
    q.client_address, q.valid_till, q.status, q.subtotal, q.discount, q.discount_type,
    q.gst_rate, q.gst_amount, q.total, q.notes, q.terms, q.payment_terms, q.unique_token,
    q.created_at, u.email AS sender_email, p.phone AS sender_phone, p.gst_number AS sender_gst,
    p.address AS sender_address, p.business_name, p.logo_url
  FROM quotes q JOIN profiles p ON q.user_id = p.user_id JOIN auth.users u ON q.user_id = u.id
  WHERE q.unique_token = p_token;
END;
$$;

-- Get quote by ID (service role)
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM quotes WHERE id = p_id LIMIT 1;
END;
$$;

-- Get profile by user_id (service role)
CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM profiles WHERE user_id = p_user_id LIMIT 1;
END;
$$;

-- Get quote items
CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS SETOF quote_items
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM quote_items WHERE quote_id = p_quote_id ORDER BY sort_order;
END;
$$;

-- Record quote action (accept, changes_requested) and update status
CREATE OR REPLACE FUNCTION record_quote_action(p_token TEXT, p_action TEXT, p_notes TEXT DEFAULT '')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_quote_id UUID;
BEGIN
  SELECT id INTO v_quote_id FROM quotes WHERE unique_token = p_token LIMIT 1;
  IF v_quote_id IS NULL THEN RETURN; END IF;
  INSERT INTO quote_events (quote_id, event_type, notes) VALUES (v_quote_id, p_action, COALESCE(p_notes, ''));
  UPDATE quotes SET status = p_action, updated_at = NOW() WHERE id = v_quote_id;
END;
$$;

-- Track when client opens the quote link
CREATE OR REPLACE FUNCTION track_quote_open(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_quote_id UUID; v_status TEXT;
BEGIN
  SELECT id, status INTO v_quote_id, v_status FROM quotes WHERE unique_token = p_token LIMIT 1;
  IF v_quote_id IS NULL THEN RETURN; END IF;
  INSERT INTO quote_events (quote_id, event_type, device_type) VALUES (v_quote_id, 'opened', 'unknown');
  IF v_status = 'sent' THEN UPDATE quotes SET status = 'opened', updated_at = NOW() WHERE id = v_quote_id; END IF;
END;
$$;

-- Create invoice from accepted quote
CREATE OR REPLACE FUNCTION create_invoice_from_quote(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_quote RECORD; v_invoice_id UUID; v_num INT;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  IF v_quote IS NULL OR v_quote.status != 'accepted' THEN RETURN NULL; END IF;
  UPDATE profiles SET invoice_counter = invoice_counter + 1 WHERE user_id = v_quote.user_id RETURNING invoice_counter INTO v_num;
  INSERT INTO invoices (user_id, quote_id, invoice_number, client_name, client_email, client_phone, client_address, subtotal, discount, discount_type, gst_rate, gst_amount, total, notes, terms, payment_terms)
  VALUES (v_quote.user_id, p_quote_id, 'INV-'||TO_CHAR(NOW(),'YYYY')||'-'||LPAD(v_num::TEXT,3,'0'), v_quote.client_name, v_quote.client_email, v_quote.client_phone, v_quote.client_address, v_quote.subtotal, v_quote.discount, v_quote.discount_type, v_quote.gst_rate, v_quote.gst_amount, v_quote.total, v_quote.notes, v_quote.terms, COALESCE(v_quote.payment_terms, ''))
  RETURNING id INTO v_invoice_id;
  INSERT INTO invoice_items (invoice_id, description, spec, quantity, unit, rate, amount, sort_order)
  SELECT v_invoice_id, description, COALESCE(spec, ''), quantity, unit, rate, amount, sort_order FROM quote_items WHERE quote_id = p_quote_id;
  UPDATE quotes SET status = 'archived' WHERE id = p_quote_id;
  RETURN v_invoice_id;
END;
$$;

-- Get invoice by ID (service role)
CREATE OR REPLACE FUNCTION get_invoice_admin(p_id UUID)
RETURNS SETOF invoices
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM invoices WHERE id = p_id LIMIT 1;
END;
$$;

-- Get invoice items
CREATE OR REPLACE FUNCTION get_invoice_items(p_invoice_id UUID)
RETURNS SETOF invoice_items
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM invoice_items WHERE invoice_id = p_invoice_id ORDER BY sort_order;
END;
$$;

-- Set default status for invoices
ALTER TABLE invoices ALTER COLUMN status SET DEFAULT 'unpaid';

-- Done!
