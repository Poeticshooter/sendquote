-- Soft Delete for Quotes
-- Allows 24-hour undo window for deleted quotes

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS original_status TEXT;

-- Index for filtering out deleted quotes in normal queries
CREATE INDEX IF NOT EXISTS idx_quotes_deleted ON quotes(is_deleted) WHERE is_deleted = true;

-- Function to permanently delete quotes older than 24 hours
CREATE OR REPLACE FUNCTION purge_soft_deleted_quotes()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM quotes WHERE is_deleted = true AND deleted_at < NOW() - INTERVAL '24 hours';
END;
$$;
