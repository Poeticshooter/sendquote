-- Deduplicate track events
-- Prevents duplicate 'opened' events from email client prefetching
-- Application-level deduplication is handled by deduplicate_track_events() function

CREATE INDEX IF NOT EXISTS idx_quote_events_dedup
  ON quote_events (quote_id, event_type, created_at);
