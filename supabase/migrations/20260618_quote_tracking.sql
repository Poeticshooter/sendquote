-- Migration: Add quote view tracking + increment RPC
-- Enables "quote opened" notifications for sellers

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_quote_view(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quotes SET
    view_count = COALESCE(view_count, 0) + 1,
    first_viewed_at = COALESCE(first_viewed_at, NOW()),
    last_viewed_at = NOW(),
    status = CASE 
      WHEN status = 'sent' THEN 'opened' 
      ELSE status 
    END
  WHERE id = quote_id AND (is_deleted IS NULL OR is_deleted = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE INDEX IF NOT EXISTS idx_quotes_not_deleted ON quotes(user_id) WHERE (is_deleted IS NULL OR is_deleted = FALSE);
