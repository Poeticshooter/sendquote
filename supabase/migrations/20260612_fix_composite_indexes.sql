-- Index for expiry check query (filters by status=sent + valid_until range)
CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON public.quotes(status, valid_until);

-- Index for portal query (lookup by client_email, ordered by created_at)
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email_created ON public.quotes(client_email, created_at DESC);

-- Index for rate_limits key lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
