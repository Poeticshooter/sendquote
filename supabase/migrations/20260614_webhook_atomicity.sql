-- Migration: Atomic webhook processing + database constraints
--
-- Fixes:
--   P0-001: Read-then-write race on webhook dedup
--   P0-002: Crash between invoice update and event insert
--   P1-003: No UNIQUE constraint on webhook_events.razorpay_event_id
--   P1-004: No UNIQUE constraint on invoices.invoice_number
--   P2-004: Missing index on invoices.quote_id
--   P2-005: Missing index on quotes.public_token
--   P1-002: No UNIQUE constraint on invoices.quote_id

-- ============================================================
-- 1. UNIQUE constraint on webhook_events.razorpay_event_id
-- ============================================================
-- Clean any existing null eventIds before adding constraint
UPDATE public.webhook_events
SET razorpay_event_id = CONCAT('migrated_', id)
WHERE razorpay_event_id IS NULL;

ALTER TABLE public.webhook_events
  DROP CONSTRAINT IF EXISTS webhook_events_razorpay_event_id_key,
  ADD CONSTRAINT webhook_events_razorpay_event_id_key UNIQUE (razorpay_event_id);

-- ============================================================
-- 2. UNIQUE constraint on invoices.invoice_number
-- ============================================================
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_invoice_number_key,
  ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);

-- ============================================================
-- 3. UNIQUE constraint on invoices.quote_id
-- Prevents duplicate invoices for the same quote at DB level
-- ============================================================
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_quote_id_key,
  ADD CONSTRAINT invoices_quote_id_key UNIQUE (quote_id);

-- ============================================================
-- 4. Index on invoices.quote_id for webhook lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);

-- ============================================================
-- 5. Index on quotes.public_token for acceptance lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes(public_token);

-- ============================================================
-- 6. Atomic payment processing RPC
--
-- Wraps event insert + invoice update in a single transaction.
-- If the event already exists (UNIQUE violation), returns 'duplicate'.
-- If crash occurs, entire transaction rolls back — no partial state.
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_razorpay_payment(
  p_razorpay_event_id TEXT,
  p_event_type TEXT,
  p_quote_id UUID,
  p_payment_amount NUMERIC,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id TEXT,
  p_invoice_id UUID DEFAULT NULL,
  p_subscription_id TEXT DEFAULT NULL,
  p_full_event JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id BIGINT;
  v_invoice RECORD;
  v_new_paid NUMERIC;
  v_new_status TEXT;
  v_result JSONB;
BEGIN
  -- Step 1: Atomically insert the event or detect duplicate
  -- The UNIQUE constraint ensures only one request can insert
  INSERT INTO public.webhook_events (razorpay_event_id, event_type, payload, outcome)
  VALUES (p_razorpay_event_id, p_event_type, p_full_event, 'processing')
  ON CONFLICT (razorpay_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  -- If event already existed, this is a safe duplicate
  -- (previous processing already committed or another concurrent request won)
  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'duplicate',
      'message', 'Event already processed'
    );
  END IF;

  -- Step 2: Process payment for quote invoices
  IF p_event_type = 'payment.captured' AND p_quote_id IS NOT NULL THEN
    SELECT id, amount, paid_amount, balance_due INTO v_invoice
    FROM public.invoices WHERE quote_id = p_quote_id;

    IF FOUND THEN
      v_new_paid := COALESCE(v_invoice.paid_amount, 0) + p_payment_amount;
      v_new_status := CASE WHEN v_new_paid >= v_invoice.amount THEN 'paid' ELSE 'pending' END;

      UPDATE public.invoices SET
        paid_amount = v_new_paid,
        balance_due = GREATEST(0, v_invoice.amount - v_new_paid),
        status = v_new_status,
        updated_at = now()
      WHERE id = v_invoice.id;

      v_result := jsonb_build_object(
        'status', 'processed',
        'paid_amount', v_new_paid,
        'invoice_status', v_new_status
      );
    ELSE
      v_result := jsonb_build_object(
        'status', 'processed',
        'note', 'No invoice found for this quote'
      );
    END IF;
  END IF;

  -- Step 3: Process subscription charge if applicable
  IF p_event_type IN ('payment.captured', 'subscription.charged') AND p_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions SET
      status = 'active',
      last_payment_attempt = now()
    WHERE razorpay_subscription_id = p_subscription_id;

    -- Also update profile
    UPDATE public.profiles p SET
      plan_expiry = (
        SELECT current_period_end FROM public.subscriptions
        WHERE razorpay_subscription_id = p_subscription_id
        LIMIT 1
      ),
      subscription_status = 'active'
    WHERE p.user_id = (
      SELECT user_id FROM public.subscriptions
      WHERE razorpay_subscription_id = p_subscription_id
      LIMIT 1
    );
  END IF;

  -- Step 4: Mark event as processed
  UPDATE public.webhook_events
  SET outcome = COALESCE(v_result->>'status', 'processed'),
      status = v_new_status
  WHERE id = v_event_id;

  IF v_result IS NULL THEN
    v_result := jsonb_build_object('status', 'processed', 'event_id', v_event_id);
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 7. Atomic quote acceptance RPC
--
-- Wraps signature + invoice + status update in a single transaction.
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_quote(
  p_public_token TEXT,
  p_signatory_name TEXT,
  p_signatory_email TEXT,
  p_signature_data TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
  v_invoice_number TEXT;
  v_result JSONB;
BEGIN
  -- Lock the quote row to prevent concurrent acceptance
  SELECT id, user_id, client_name, client_email, status,
         subtotal, gst_rate, gst_amount, total,
         organization_id, quote_number
  INTO v_quote
  FROM public.quotes
  WHERE public_token = p_public_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Quote not found');
  END IF;

  IF v_quote.status = 'accepted' THEN
    RETURN jsonb_build_object('status', 'duplicate', 'message', 'Quote already accepted');
  END IF;

  IF v_quote.status != 'sent' THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Quote must be in "sent" status to accept');
  END IF;

  -- Store signature
  INSERT INTO public.quote_signatures (quote_id, signatory_name, signatory_email, signature_data)
  VALUES (v_quote.id, p_signatory_name, p_signatory_email, p_signature_data);

  -- Generate invoice number
  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || UPPER(SUBSTR(MD5(NOW()::TEXT), 1, 8));

  -- Create invoice with GST split fields
  INSERT INTO public.invoices (
    user_id, quote_id, invoice_number, client_name, client_email,
    amount, subtotal, gst_rate, gst_amount,
    cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount,
    paid_amount, balance_due, status,
    organization_id
  ) VALUES (
    v_quote.user_id, v_quote.id, v_invoice_number, v_quote.client_name, v_quote.client_email,
    v_quote.total, v_quote.subtotal, v_quote.gst_rate, v_quote.gst_amount,
    COALESCE(v_quote.cgst_rate, 0), COALESCE(v_quote.cgst_amount, 0),
    COALESCE(v_quote.sgst_rate, 0), COALESCE(v_quote.sgst_amount, 0),
    COALESCE(v_quote.igst_rate, 0), COALESCE(v_quote.igst_amount, 0),
    0, v_quote.total, 'pending',
    v_quote.organization_id
  );

  -- Update quote status
  UPDATE public.quotes
  SET status = 'accepted', updated_at = now()
  WHERE id = v_quote.id AND status = 'sent';

  -- Log event
  INSERT INTO public.quote_events (quote_id, event_type, metadata)
  VALUES (v_quote.id, 'accepted', jsonb_build_object(
    'signatory_name', p_signatory_name,
    'invoice_number', v_invoice_number
  ));

  RETURN jsonb_build_object(
    'status', 'accepted',
    'invoice_number', v_invoice_number,
    'quote_id', v_quote.id
  );
END;
$$;
