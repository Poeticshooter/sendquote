-- Performance indexes for common query patterns

-- Dashboard: user's quotes sorted by recency
CREATE INDEX IF NOT EXISTS idx_quotes_user_status_created
  ON public.quotes (user_id, status, created_at DESC);

-- Analytics: quote events by type and time
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_type_time
  ON public.quote_events (quote_id, event_type, created_at DESC);

-- Client lookup by user
CREATE INDEX IF NOT EXISTS idx_clients_user_email
  ON public.clients (user_id, email);

-- Invoice lookup by user
CREATE INDEX IF NOT EXISTS idx_invoices_user_status
  ON public.invoices (user_id, status, created_at DESC);

-- Activity logs by user and time
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time
  ON public.activity_logs (user_id, created_at DESC);
