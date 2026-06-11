-- Migration: Create the increment_rate_limit RPC and ensure rate_limits table exists
-- The function was referenced by src/lib/security.ts but never created.
-- This caused all API rate limiting to fall through to per-instance in-memory (broken in serverless).

-- Ensure the rate_limits table exists (created manually in initial schema)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The increment_rate_limit RPC: atomically increments counter and returns whether allowed
-- Uses INSERT ... ON CONFLICT for atomic upsert (no read-then-write race)
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_ms INTEGER
) RETURNS TABLE(allowed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Get current window
  SELECT reset_at INTO v_reset_at FROM public.rate_limits WHERE key = p_key;

  -- If no entry or window expired, start new window
  IF v_reset_at IS NULL OR now() > v_reset_at THEN
    v_reset_at := now() + (p_window_ms || ' milliseconds')::INTERVAL;
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at)
    ON CONFLICT (key) DO UPDATE SET
      count = 1,
      reset_at = v_reset_at
    RETURNING count INTO v_count;

    RETURN QUERY SELECT true AS allowed;
    RETURN;
  END IF;

  -- Window still active — increment counter
  UPDATE public.rate_limits
  SET count = count + 1
  WHERE key = p_key
  RETURNING count INTO v_count;

  -- Return whether under limit
  RETURN QUERY SELECT (v_count <= p_max_requests) AS allowed;
END;
$$;

-- Index already exists: idx_rate_limits_key on public.rate_limits(key)
