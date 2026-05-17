-- Migration 019: Composite indexes for high-traffic query patterns
-- Targets: dashboard quote/invoice lists, cron job date-range queries, status filtering
-- Rationale: Single-column indexes on user_id alone cannot satisfy WHERE user_id = ? AND status = ?
-- efficiently. Composite indexes allow the planner to use a single index scan instead of bitmap AND.

-- quotes: Dashboard lists quotes by user + status, and sorts by created_at DESC
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_user_created ON quotes(user_id, created_at DESC);

-- invoices: Invoice list filters by user + status, sorts by created_at DESC
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON invoices(user_id, created_at DESC);
