-- Migration 008: Add missing tables referenced by cron jobs
-- Tables: cron_reminders, quote_events, activity_logs

-- ============================================
-- CRON REMINDERS
-- Tracks which reminders have been sent to avoid duplicates
-- ============================================
CREATE TABLE IF NOT EXISTS cron_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow_up', 'after_open', 'expiry_warning', 'invoice_overdue')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_quote_reminder UNIQUE (quote_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_cron_reminders_quote ON cron_reminders(quote_id);
CREATE INDEX IF NOT EXISTS idx_cron_reminders_type ON cron_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_cron_reminders_sent ON cron_reminders(sent_at DESC);

ALTER TABLE cron_reminders ENABLE ROW LEVEL SECURITY;

-- Only system (service role) inserts; admins can read for debugging
DROP POLICY IF EXISTS "Admins can read cron reminders" ON cron_reminders;
CREATE POLICY "Admins can read cron reminders"
  ON cron_reminders FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can manage cron reminders" ON cron_reminders;
CREATE POLICY "System can manage cron reminders"
  ON cron_reminders FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- QUOTE EVENTS
-- Detailed event tracking for quote lifecycle (opened, accepted, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'accepted', 'changes_requested', 'expired', 'sent', 'viewed')),
  ip TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_events_created ON quote_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_type ON quote_events(quote_id, event_type, created_at DESC);

ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

-- Quote owners can view their events; anyone can insert (for tracking)
DROP POLICY IF EXISTS "Quote owners can view events" ON quote_events;
CREATE POLICY "Quote owners can view events"
  ON quote_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_events.quote_id AND quotes.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can insert quote events" ON quote_events;
CREATE POLICY "Anyone can insert quote events"
  ON quote_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ACTIVITY LOGS
-- User activity log for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rename columns if old names exist (for databases migrated before this fix)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'resource_type') THEN
    ALTER TABLE activity_logs RENAME COLUMN resource_type TO entity_type;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'resource_id') THEN
    ALTER TABLE activity_logs RENAME COLUMN resource_id TO entity_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'details') THEN
    ALTER TABLE activity_logs RENAME COLUMN details TO metadata;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity; admins can view all
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);
