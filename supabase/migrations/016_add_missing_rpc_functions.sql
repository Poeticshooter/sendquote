-- Migration 016: Define missing RPC functions referenced in TypeScript code
-- Each function includes inline comments describing its behavior and caller.

-- ============================================
-- get_quote_admin
-- Called by: src/app/api/send-quote-email/route.ts
-- Returns a full quote record by ID. SECURITY DEFINER for admin API access.
-- ============================================
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM quotes WHERE id = p_id;
END;
$$;

-- ============================================
-- get_profile_admin
-- Called by: src/app/api/send-quote-email/route.ts
-- Returns a profile record by user_id. SECURITY DEFINER for admin API access.
-- ============================================
CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM profiles WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- get_quote_items
-- Called by: src/app/api/send-quote-email/route.ts
-- Returns line items for a given quote, ordered by sort_order.
-- SECURITY DEFINER for admin API access.
-- ============================================
CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS SETOF quote_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM quote_items
  WHERE quote_id = p_quote_id
  ORDER BY sort_order;
END;
$$;

-- ============================================
-- record_quote_action
-- Called by: src/app/api/send-quote-email/route.ts
-- Records a quote action event (e.g., 'sent', 'opened') in quote_events
-- and updates the quote status if transitioning from draft.
-- ============================================
CREATE OR REPLACE FUNCTION record_quote_action(
  p_token TEXT,
  p_action TEXT,
  p_notes TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  SELECT id INTO v_quote_id FROM quotes WHERE unique_token = p_token;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Record the event
  INSERT INTO quote_events (quote_id, event_type, metadata)
  VALUES (v_quote_id, p_action, jsonb_build_object('notes', p_notes));

  -- Update status if transitioning from draft
  UPDATE quotes SET status = 'sent', updated_at = NOW()
  WHERE id = v_quote_id AND status = 'draft';

  RETURN TRUE;
END;
$$;

-- ============================================
-- next_quote_number
-- Called by: src/app/api/duplicate-quote/route.ts, src/components/quote-wizard.tsx
-- Generates the next sequential quote number for a user (e.g., "QS-0001").
-- Uses the monthly_quote_count as a proxy for the next number.
-- ============================================
CREATE OR REPLACE FUNCTION next_quote_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COALESCE(monthly_quote_count, 0) + 1 INTO v_count
  FROM profiles WHERE user_id = p_user_id;

  v_number := 'QS-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- ============================================
-- apply_coupon
-- Called by: src/app/api/create-razorpay-order/route.ts
-- Records a coupon usage for a user. The caller should have already validated
-- the coupon and created the coupon_usages row; this increments the used_count.
-- Note: The increment_coupon_usage trigger on coupon_usages already handles
-- incrementing used_count, so this is a no-op placeholder for compatibility.
-- ============================================
CREATE OR REPLACE FUNCTION apply_coupon(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- The increment_coupon_usage trigger on coupon_usages already handles
  -- incrementing used_count when a usage row is inserted.
  -- This function exists for API compatibility and does nothing extra.
  RETURN TRUE;
END;
$$;

-- ============================================
-- check_team_limit
-- Already defined in migration 012. Recreating here for idempotency.
-- Returns JSONB with allowed, current, limit, and plan fields.
-- ============================================
CREATE OR REPLACE FUNCTION check_team_limit(p_account_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_member_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE user_id = p_account_user_id;

  v_limit := CASE v_plan
    WHEN 'professional' THEN 5
    WHEN 'starter' THEN 1
    ELSE 0
  END;

  SELECT COUNT(*) INTO v_member_count
  FROM team_members
  WHERE account_user_id = p_account_user_id AND status != 'removed';

  RETURN jsonb_build_object(
    'allowed', v_member_count < v_limit,
    'current', v_member_count,
    'limit', v_limit,
    'plan', v_plan
  );
END;
$$;

-- ============================================
-- cleanup_expired_admin_sessions
-- Called by: src/app/api/cron/route.ts (via REST API call)
-- Deletes admin sessions that have expired.
-- ============================================
DROP FUNCTION IF EXISTS cleanup_expired_admin_sessions();
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- purge_soft_deleted_quotes
-- Called by: src/app/api/cron/route.ts (via REST API call)
-- Permanently deletes quotes that were soft-deleted more than 24 hours ago.
-- ============================================
DROP FUNCTION IF EXISTS purge_soft_deleted_quotes();
CREATE OR REPLACE FUNCTION purge_soft_deleted_quotes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM quotes
  WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- downgrade_expired_plans
-- Called by: src/app/api/cron/route.ts (via REST API call)
-- Downgrades users whose plan_expiry has passed back to the free plan.
-- ============================================
DROP FUNCTION IF EXISTS downgrade_expired_plans();
CREATE OR REPLACE FUNCTION downgrade_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE profiles
  SET plan = 'free', plan_expiry = NULL, billing_cycle = 'monthly'
  WHERE plan != 'free'
    AND plan_expiry IS NOT NULL
    AND plan_expiry < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
