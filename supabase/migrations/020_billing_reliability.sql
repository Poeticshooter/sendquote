-- Migration 020: Billing reliability schema additions
-- Targets: cancellation tracking, webhook outcome auditing, refund tracking
-- Rationale: Need to track when subscriptions were cancelled (for grace period logic)
-- and whether webhook events were successfully processed.

-- Add cancelled_at to subscriptions for grace period tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Add outcome tracking to webhook_events for auditability
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'processed' CHECK (outcome IN ('processed', 'ignored', 'failed'));
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);

-- Index for finding subscriptions nearing expiry (renewal reminders)
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- Index for cancelled subscriptions (grace period queries)
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancelled ON subscriptions(cancelled_at) WHERE cancelled_at IS NOT NULL AND status = 'cancelled';
