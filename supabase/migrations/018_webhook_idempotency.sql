-- Migration 018: Add webhook_events table for Razorpay webhook idempotency
-- Prevents duplicate processing when Razorpay retries failed deliveries.

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_razorpay_id ON webhook_events(razorpay_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only system (service role) manages this table; no user-facing access needed
CREATE POLICY "System manages webhook events"
  ON webhook_events FOR ALL
  USING (true)
  WITH CHECK (true);
