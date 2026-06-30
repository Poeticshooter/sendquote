-- Migration: Fix all schema bugs found during 360° audit
--
-- 1. webhook_events needs status column (process_razorpay_payment RPC references it)
-- 2. Fix process_razorpay_payment RPC to handle null v_new_status
-- 3. Fix rate_limit RPC to match the actual table schema (uses reset_at but table has first_seen)
-- 4. Consolidate duplicate rate_limit RPCs into one

-- ============================================================
-- 1. Add status column to webhook_events
-- Referenced by process_razorpay_payment RPC but never created
-- ============================================================
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'received';

-- ============================================================
-- 2. Fix process_razorpay_payment RPC
-- The UPDATE at end references status column (now fixed)
-- Also fix the variable usage when v_new_status might be unset
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
  INSERT INTO public.webhook_events (razorpay_event_id, event_type, payload, outcome, status)
  VALUES (p_razorpay_event_id, p_event_type, p_full_event, 'processing', 'processing')
  ON CONFLICT (razorpay_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'duplicate',
      'message', 'Event already processed'
    );
  END IF;

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

  IF p_event_type IN ('payment.captured', 'subscription.charged') AND p_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions SET
      status = 'active',
      last_payment_attempt = now()
    WHERE razorpay_subscription_id = p_subscription_id;

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

  UPDATE public.webhook_events
  SET outcome = COALESCE(v_result->>'status', 'processed'),
      status = COALESCE(v_new_status, 'processed')
  WHERE id = v_event_id;

  IF v_result IS NULL THEN
    v_result := jsonb_build_object('status', 'processed', 'event_id', v_event_id);
  END IF;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 3. Fix increment_rate_limit RPC
-- The table uses first_seen + updated_at, not reset_at
-- Consolidate both RPCs into a single correct version
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_ms INTEGER DEFAULT 60000
) RETURNS TABLE(remaining INTEGER, allowed BOOLEAN, reset_at BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.rate_limits (key, count, first_seen, updated_at)
  VALUES (p_key, 1, now(), now())
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.first_seen < now() - (p_window_ms * interval '1 ms')
      THEN 1
      ELSE rate_limits.count + 1
    END,
    first_seen = CASE
      WHEN rate_limits.first_seen < now() - (p_window_ms * interval '1 ms')
      THEN now()
      ELSE rate_limits.first_seen
    END,
    updated_at = now()
  RETURNING
    GREATEST(0, p_max_requests - rate_limits.count) AS remaining,
    rate_limits.count <= p_max_requests AS allowed,
    EXTRACT(EPOCH FROM (rate_limits.first_seen + (p_window_ms * interval '1 ms'))) * 1000 AS reset_at;

  RETURN NEXT;
END;
$$;
