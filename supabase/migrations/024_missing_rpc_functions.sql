-- Migration 024: Missing RPC functions referenced by code but not in migrations
-- These are SECURITY DEFINER functions used by API routes and cron jobs.

-- ============================================
-- get_dashboard_stats
-- Returns aggregate stats for a user's quotes
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS TABLE(total_quotes BIGINT, total_value NUMERIC, accepted BIGINT, outstanding NUMERIC, overdue BIGINT, month_count INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE is_deleted = false)::BIGINT AS total_quotes,
    COALESCE(SUM(CASE WHEN is_deleted = false THEN total ELSE 0 END), 0)::NUMERIC AS total_value,
    COUNT(*) FILTER (WHERE status = 'accepted' AND is_deleted = false)::BIGINT AS accepted,
    COALESCE(SUM(CASE WHEN status IN ('sent', 'opened') AND is_deleted = false THEN total ELSE 0 END), 0)::NUMERIC AS outstanding,
    COUNT(*) FILTER (WHERE status IN ('sent', 'opened') AND is_deleted = false AND valid_until < NOW())::BIGINT AS overdue,
    (SELECT monthly_quote_count FROM profiles WHERE user_id = p_user_id LIMIT 1)::INTEGER AS month_count
  FROM quotes
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- next_quote_number
-- Generates the next sequential quote number for a user
-- ============================================
CREATE OR REPLACE FUNCTION next_quote_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM quotes WHERE user_id = p_user_id;
  v_number := 'QS-' || LPAD((v_count + 1)::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- ============================================
-- get_quote_admin
-- Returns a quote by ID (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM quotes WHERE id = p_id LIMIT 1;
$$;

-- ============================================
-- get_profile_admin
-- Returns a user's profile by user_id (bypasses RLS)
-- ============================================
CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS SETOF profiles
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM profiles WHERE user_id = p_user_id LIMIT 1;
$$;

-- ============================================
-- get_quote_items
-- Returns line items for a quote, ordered by sort_order
-- ============================================
CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS SETOF quote_items
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM quote_items WHERE quote_id = p_quote_id ORDER BY sort_order;
$$;

-- ============================================
-- record_quote_action
-- Records a quote action in quote_events using the public token
-- ============================================
DROP FUNCTION IF EXISTS record_quote_action(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION record_quote_action(p_token TEXT, p_action TEXT, p_notes TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  SELECT id INTO v_quote_id FROM quotes WHERE unique_token = p_token LIMIT 1;
  IF v_quote_id IS NOT NULL THEN
    INSERT INTO quote_events (quote_id, event_type, notes)
    VALUES (v_quote_id, p_action, p_notes);
  END IF;
END;
$$;

-- ============================================
-- cleanup_expired_admin_sessions
-- Deletes admin_sessions where expires_at < NOW()
-- ============================================
DROP FUNCTION IF EXISTS cleanup_expired_admin_sessions();
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS VOID
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM admin_sessions WHERE expires_at < NOW();
$$;

-- ============================================
-- purge_soft_deleted_quotes
-- Hard-deletes soft-deleted quotes older than 24 hours
-- ============================================
DROP FUNCTION IF EXISTS purge_soft_deleted_quotes();
CREATE OR REPLACE FUNCTION purge_soft_deleted_quotes()
RETURNS VOID
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM quotes WHERE is_deleted = true AND deleted_at < NOW() - INTERVAL '24 hours';
$$;

-- ============================================
-- downgrade_expired_plans
-- Downgrades expired plans back to 'free'
-- ============================================
DROP FUNCTION IF EXISTS downgrade_expired_plans();
CREATE OR REPLACE FUNCTION downgrade_expired_plans()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET plan = 'free', plan_expiry = NULL
  WHERE plan != 'free'
    AND plan_expiry IS NOT NULL
    AND plan_expiry < NOW();
END;
$$;
