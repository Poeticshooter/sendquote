-- Migration: Create increment_rate_limit RPC for distributed rate limiting
-- This fixes the issue where the in-memory rate limiter is non-functional
-- in serverless environments (each instance has its own memory).

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_ms INTEGER DEFAULT 60000
)
RETURNS TABLE(remaining INTEGER, allowed BOOLEAN, reset_at BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert the rate limit entry
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
    EXTRACT(EPOCH FROM (rate_limits.first_seen + (p_window_ms * interval '1 ms'))) * 1000 AS reset_at
  INTO remaining, allowed, reset_at;

  RETURN NEXT;
END;
$$;
