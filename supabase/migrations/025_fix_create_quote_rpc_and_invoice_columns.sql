-- Migration 025: Fix create_quote_with_items RPC and add missing invoice columns

-- ============================================
-- Fix create_quote_with_items RPC
-- The original (migration 002) used valid_till which was dropped in migration 011.
-- This recreates it with valid_until (TIMESTAMPTZ).
-- ============================================
DROP FUNCTION IF EXISTS create_quote_with_items(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, NUMERIC, NUMERIC, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION create_quote_with_items(
  p_user_id UUID,
  p_quote_number TEXT,
  p_unique_token TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_client_address TEXT,
  p_valid_until TIMESTAMPTZ,
  p_payment_terms TEXT,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_discount_type TEXT,
  p_gst_rate NUMERIC,
  p_gst_amount NUMERIC,
  p_total NUMERIC,
  p_notes TEXT,
  p_terms TEXT,
  p_status TEXT,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_item JSONB;
BEGIN
  INSERT INTO quotes (
    user_id, quote_number, unique_token, client_name, client_email,
    client_phone, client_address, valid_until, payment_terms, subtotal,
    discount, discount_type, gst_rate, gst_amount, total, notes, terms, status
  ) VALUES (
    p_user_id, p_quote_number, p_unique_token, p_client_name, p_client_email,
    p_client_phone, p_client_address, p_valid_until, p_payment_terms, p_subtotal,
    p_discount, p_discount_type, p_gst_rate, p_gst_amount, p_total, p_notes, p_terms, p_status
  ) RETURNING id INTO v_quote_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO quote_items (
      quote_id, description, spec, quantity, unit, rate, amount, sort_order
    ) VALUES (
      v_quote_id,
      v_item->>'description',
      COALESCE(v_item->>'spec', ''),
      (v_item->>'quantity')::NUMERIC,
      v_item->>'unit',
      (v_item->>'rate')::NUMERIC,
      (v_item->>'amount')::NUMERIC,
      (v_item->>'sort_order')::INT
    );
  END LOOP;

  RETURN v_quote_id;
END;
$$;

-- ============================================
-- Add missing columns to invoices table
-- ============================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;

-- Backfill total from amount/subtotal where total is NULL
UPDATE invoices SET total = COALESCE(subtotal, amount) WHERE total IS NULL;
