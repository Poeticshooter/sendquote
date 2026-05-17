-- Migration 021: Missing tables for activity logging and cron reminders
-- Targets: activity_logs, cron_reminders
-- Rationale: These tables are referenced in code but were never created.
-- Without them, activity logging and cron reminders fail with "relation does not exist".

-- Activity logs: tracks user actions on quotes, invoices, clients, payments
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('quote', 'invoice', 'client', 'payment')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- Cron reminders: tracks which reminder emails have been sent to avoid duplicates
CREATE TABLE IF NOT EXISTS cron_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow_up', 'after_open', 'expiry_warning', 'invoice_overdue')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_reminders_unique ON cron_reminders(quote_id, reminder_type);
CREATE INDEX IF NOT EXISTS idx_cron_reminders_quote ON cron_reminders(quote_id);
CREATE INDEX IF NOT EXISTS idx_cron_reminders_sent ON cron_reminders(sent_at DESC);

ALTER TABLE cron_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System manages cron reminders" ON cron_reminders;
CREATE POLICY "System manages cron reminders" ON cron_reminders FOR ALL USING (true) WITH CHECK (true);
