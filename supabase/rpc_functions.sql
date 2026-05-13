-- ============================================================
-- QuoteSend RPC Functions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. get_quote_admin: Returns a single quote with all fields (admin-level)
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM quotes WHERE id = p_id LIMIT 1;
END;
$$;

-- 2. get_profile_admin: Returns user profile with business info
CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM profiles WHERE user_id = p_user_id LIMIT 1;
END;
$$;

-- 3. get_quote_items: Returns line items for a quote
CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS SETOF quote_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM quote_items WHERE quote_id = p_quote_id ORDER BY sort_order;
END;
$$;

-- 4. record_quote_action: Records a quote event and updates quote status
CREATE OR REPLACE FUNCTION record_quote_action(
  p_token TEXT,
  p_action TEXT,
  p_notes TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_user_id UUID;
  v_email TEXT;
BEGIN
  SELECT id, user_id INTO v_quote_id, v_user_id FROM quotes WHERE unique_token = p_token LIMIT 1;
  IF v_quote_id IS NULL THEN RETURN; END IF;

  INSERT INTO quote_events (quote_id, event_type, notes)
  VALUES (v_quote_id, p_action, COALESCE(p_notes, ''));

  UPDATE quotes SET status = p_action, updated_at = NOW() WHERE id = v_quote_id;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF p_action = 'opened' AND v_email IS NOT NULL THEN
    -- Could trigger notifyQuoteOpened email here via pg_trigger
    NULL;
  ELSIF p_action = 'accepted' AND v_email IS NOT NULL THEN
    -- notifyQuoteAccepted
    NULL;
  ELSIF p_action = 'changes_requested' AND v_email IS NOT NULL THEN
    -- notifyChangesRequested
    NULL;
  END IF;
END;
$$;

-- 5. track_quote_open: Simple tracking for the tracking pixel
CREATE OR REPLACE FUNCTION track_quote_open(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_quote_status TEXT;
BEGIN
  SELECT id, status INTO v_quote_id, v_quote_status FROM quotes WHERE unique_token = p_token LIMIT 1;
  IF v_quote_id IS NULL THEN RETURN; END IF;

  INSERT INTO quote_events (quote_id, event_type, device_type)
  VALUES (v_quote_id, 'opened', 'unknown')
  ON CONFLICT DO NOTHING;

  IF v_quote_status = 'sent' THEN
    UPDATE quotes SET status = 'opened', updated_at = NOW() WHERE id = v_quote_id;
  END IF;
END;
$$;

-- 6. get_quote_by_token: Returns quote data for public page
CREATE OR REPLACE FUNCTION get_quote_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  quote_number TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  valid_till DATE,
  status TEXT,
  subtotal NUMERIC,
  discount NUMERIC,
  discount_type TEXT,
  gst_rate NUMERIC,
  gst_amount NUMERIC,
  total NUMERIC,
  notes TEXT,
  terms TEXT,
  payment_terms TEXT,
  unique_token TEXT,
  created_at TIMESTAMPTZ,
  sender_email TEXT,
  sender_phone TEXT,
  sender_gst TEXT,
  sender_address TEXT,
  business_name TEXT,
  logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.quote_number,
    q.client_name,
    q.client_email,
    q.client_phone,
    q.client_address,
    q.valid_till,
    q.status,
    q.subtotal,
    q.discount,
    q.discount_type,
    q.gst_rate,
    q.gst_amount,
    q.total,
    q.notes,
    q.terms,
    q.payment_terms,
    q.unique_token,
    q.created_at,
    u.email AS sender_email,
    p.phone AS sender_phone,
    p.gst_number AS sender_gst,
    p.address AS sender_address,
    p.business_name,
    p.logo_url
  FROM quotes q
  JOIN profiles p ON q.user_id = p.user_id
  JOIN auth.users u ON q.user_id = u.id
  WHERE q.unique_token = p_token;
END;
$$;

-- 7. create_invoice_from_quote: Converts an accepted quote to invoice
CREATE OR REPLACE FUNCTION create_invoice_from_quote(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
  v_invoice_id UUID;
  v_quote_number TEXT;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;

  IF v_quote IS NULL THEN RETURN NULL; END IF;
  IF v_quote.status != 'accepted' THEN RETURN NULL; END IF;

  SELECT COALESCE(MAX(SPLIT_PART(invoice_number, '-', 3)::INT), 0) + 1
  INTO v_quote_number FROM invoices WHERE user_id = v_quote.user_id;

  INSERT INTO invoices (
    user_id, quote_id, invoice_number, client_name, client_email,
    client_phone, client_address, subtotal, discount, discount_type,
    gst_rate, gst_amount, total, notes, terms
  ) VALUES (
    v_quote.user_id, p_quote_id,
    'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_quote_number::TEXT, 3, '0'),
    v_quote.client_name, v_quote.client_email, v_quote.client_phone,
    v_quote.client_address, v_quote.subtotal, v_quote.discount,
    v_quote.discount_type, v_quote.gst_rate, v_quote.gst_amount,
    v_quote.total, v_quote.notes, v_quote.terms
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_items (invoice_id, description, quantity, unit, rate, amount, sort_order)
  SELECT v_invoice_id, description, quantity, unit, rate, amount, sort_order
  FROM quote_items WHERE quote_id = p_quote_id;

  UPDATE quotes SET status = 'archived' WHERE id = p_quote_id;

  RETURN v_invoice_id;
END;
$$;

-- 8. get_invoice_admin: Returns a single invoice (admin-level)
CREATE OR REPLACE FUNCTION get_invoice_admin(p_id UUID)
RETURNS SETOF invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM invoices WHERE id = p_id LIMIT 1;
END;
$$;

-- 9. get_invoice_items: Returns line items for an invoice
CREATE OR REPLACE FUNCTION get_invoice_items(p_invoice_id UUID)
RETURNS SETOF invoice_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM invoice_items WHERE invoice_id = p_invoice_id ORDER BY sort_order;
END;
$$;