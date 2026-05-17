-- Migration 017: Add upsert_rate_limit RPC function
-- The code calls upsert_rate_limit but migration 000 only defined check_rate_limit.
-- This creates the function the code actually uses.

CREATE OR REPLACE FUNCTION upsert_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  v_entry RECORD;
BEGIN
  SELECT * INTO v_entry FROM rate_limits WHERE key = p_key;
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, first_seen, updated_at)
    VALUES (p_key, 1, v_now, v_now) RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.first_seen < v_window_start THEN
    UPDATE rate_limits SET count = 1, first_seen = v_now, updated_at = v_now WHERE key = p_key
    RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.count >= p_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0, 'retryAfter', CEIL(EXTRACT(EPOCH FROM (v_entry.first_seen + (p_window_seconds || ' seconds')::INTERVAL - v_now))));
  END IF;
  UPDATE rate_limits SET count = count + 1, updated_at = v_now WHERE key = p_key
  RETURNING * INTO v_entry;
  RETURN json_build_object('allowed', true, 'remaining', p_max - v_entry.count, 'count', v_entry.count);
END;
$$;
