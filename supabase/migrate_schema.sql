-- QuoteSend Database Schema
-- Run this in Supabase SQL Editor after creating a new project

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  gst_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional')),
  plan_expiry TIMESTAMPTZ,
  monthly_quote_count INT NOT NULL DEFAULT 0,
  last_quote_reset DATE DEFAULT CURRENT_DATE,
  invoice_counter INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUOTES
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  valid_till DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','opened','accepted','changes_requested','expired','lost','archived')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  unique_token TEXT UNIQUE NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_token ON quotes(unique_token);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created ON quotes(created_at);

-- 3. QUOTE ITEMS
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'nos',
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- 4. QUOTE EVENTS (Open Tracking)
CREATE TABLE quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent','opened','accepted','changes_requested','expired','viewed')),
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_events_quote ON quote_events(quote_id);
CREATE INDEX idx_quote_events_type ON quote_events(event_type);

-- 5. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'starter',
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','cancelled','expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- 6. AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_quotes_updated_at
  BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
CREATE POLICY "Users own their profile"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read/write their own quotes
CREATE POLICY "Users own their quotes"
  ON quotes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read/write their own quote items
CREATE POLICY "Users own their quote items"
  ON quote_items FOR ALL
  USING (quote_id IN (SELECT id FROM quotes WHERE user_id = auth.uid()));

-- Users can read/write their own quote events
CREATE POLICY "Users own their quote events"
  ON quote_events FOR ALL
  USING (quote_id IN (SELECT id FROM quotes WHERE user_id = auth.uid()));

-- Users can read/write their own subscriptions
CREATE POLICY "Users own their subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, business_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','cancelled')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote ON invoices(quote_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their invoices"
  ON invoices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 10. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'nos',
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their invoice items"
  ON invoice_items FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- 11. Add due_date to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

-- 12. Add spec to quote_items
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '';

-- 13. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their payments"
  ON payments FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- 14. Add tags to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 15. Add spec to invoice_items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '';

-- 16. Add payment_terms to quotes and invoices if missing
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';

-- 17. Add invoice_counter to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_counter INT NOT NULL DEFAULT 0;

-- 18. Add payment_terms to quotes and invoices if missing
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT '';

-- 19. Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to read own waitlist entry" ON waitlist FOR SELECT USING (true);

-- 20. CREATE RPC FUNCTIONS

DROP FUNCTION IF EXISTS get_quote_admin(UUID);
DROP FUNCTION IF EXISTS get_profile_admin(UUID);
DROP FUNCTION IF EXISTS get_quote_items(UUID);
DROP FUNCTION IF EXISTS record_quote_action(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS track_quote_open(TEXT);
DROP FUNCTION IF EXISTS get_quote_by_token(TEXT);
DROP FUNCTION IF EXISTS create_invoice_from_quote(UUID);
DROP FUNCTION IF EXISTS get_invoice_admin(UUID);
DROP FUNCTION IF EXISTS get_invoice_items(UUID);

-- Get quote by public token
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

-- Get quote admin
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM quotes WHERE id = p_id LIMIT 1;
END;
$$;

-- Get profile by user_id
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

-- Record quote action
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

-- Track quote open
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

-- Create invoice from quote
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

-- Increment invoice counter
CREATE OR REPLACE FUNCTION next_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_num INT; v_result TEXT;
BEGIN
  UPDATE profiles SET invoice_counter = invoice_counter + 1 WHERE user_id = p_user_id RETURNING invoice_counter INTO v_num;
  v_result := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_num::TEXT, 3, '0');
  RETURN v_result;
END;
$$;

-- Get invoice admin
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

-- Get quote admin (service role access)
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', q.id,
    'user_id', q.user_id,
    'quote_number', q.quote_number,
    'client_name', q.client_name,
    'client_address', q.client_address,
    'client_email', q.client_email,
    'client_phone', q.client_phone,
    'valid_till', q.valid_till,
    'status', q.status,
    'subtotal', q.subtotal,
    'discount', q.discount,
    'discount_type', q.discount_type,
    'gst_rate', q.gst_rate,
    'gst_amount', q.gst_amount,
    'total', q.total,
    'notes', q.notes,
    'terms', q.terms,
    'payment_terms', q.payment_terms,
    'unique_token', q.unique_token,
    'created_at', q.created_at,
    'business_name', p.business_name,
    'logo_url', p.logo_url
  )
  INTO result
  FROM quotes q
  JOIN profiles p ON p.user_id = q.user_id
  WHERE q.id = p_id;

  RETURN result;
END;
$$;

-- Get profile by user_id
CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'business_name', business_name,
    'logo_url', logo_url,
    'phone', phone,
    'gst_number', gst_number,
    'address', address
  )
  INTO result
  FROM profiles
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$;

-- Get quote items as JSON
CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', id,
    'description', description,
    'spec', spec,
    'quantity', quantity,
    'unit', unit,
    'rate', rate,
    'amount', amount,
    'sort_order', sort_order
  ) ORDER BY sort_order), '[]'::json)
  INTO result
  FROM quote_items
  WHERE quote_id = p_quote_id;

  RETURN result;
END;
$$;

-- Record quote action (tracking event)
CREATE OR REPLACE FUNCTION record_quote_action(p_token TEXT, p_action TEXT, p_notes TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  SELECT id INTO v_quote_id FROM quotes WHERE unique_token = p_token;

  INSERT INTO quote_events (quote_id, event_type, notes)
  VALUES (v_quote_id, p_action, COALESCE(p_notes, ''));
END;
$$;

-- Create invoice from quote
CREATE OR REPLACE FUNCTION create_invoice_from_quote(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_count INT;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;

  SELECT COUNT(*) + 1 INTO v_count FROM invoices WHERE user_id = v_quote.user_id;
  v_invoice_number := 'INV-' || LPAD(v_count::TEXT, 4, '0');

  INSERT INTO invoices (
    user_id, quote_id, invoice_number, client_name, client_email,
    client_phone, client_address, subtotal, discount, discount_type,
    gst_rate, gst_amount, total, notes, terms
  ) VALUES (
    v_quote.user_id, v_quote.id, v_invoice_number, v_quote.client_name,
    v_quote.client_email, v_quote.client_phone, v_quote.client_address,
    v_quote.subtotal, v_quote.discount, v_quote.discount_type,
    v_quote.gst_rate, v_quote.gst_amount, v_quote.total,
    v_quote.notes, v_quote.terms
  )
  RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_items (invoice_id, description, spec, quantity, unit, rate, amount, sort_order)
  SELECT v_invoice_id, description, COALESCE(spec, ''), quantity, unit, rate, amount, sort_order
  FROM quote_items
  WHERE quote_id = p_quote_id
  ORDER BY sort_order;

  UPDATE quotes SET status = 'accepted', updated_at = NOW() WHERE id = p_quote_id;

  RETURN v_invoice_id;
END;
$$;

-- Get invoice admin
CREATE OR REPLACE FUNCTION get_invoice_admin(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'user_id', user_id,
    'invoice_number', invoice_number,
    'client_name', client_name,
    'client_address', client_address,
    'client_email', client_email,
    'client_phone', client_phone,
    'status', status,
    'subtotal', subtotal,
    'discount', discount,
    'discount_type', discount_type,
    'gst_rate', gst_rate,
    'gst_amount', gst_amount,
    'total', total,
    'notes', notes,
    'terms', terms,
    'due_date', due_date,
    'created_at', created_at
  )
  INTO result
  FROM invoices
  WHERE id = p_id;

  RETURN result;
END;
$$;

-- Get invoice items
CREATE OR REPLACE FUNCTION get_invoice_items(p_invoice_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(json_build_object(
    'id', id,
    'description', description,
    'spec', COALESCE(spec, ''),
    'quantity', quantity,
    'unit', unit,
    'rate', rate,
    'amount', amount,
    'sort_order', sort_order
  ) ORDER BY sort_order), '[]'::json)
  INTO result
  FROM invoice_items
  WHERE invoice_id = p_invoice_id;

  RETURN result;
END;
$$;