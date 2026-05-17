-- Migration 015: Add webhooks table for user-configurable outgoing webhooks
-- Users can register webhook URLs to receive event notifications (quote created, accepted, etc.)

-- ============================================
-- WEBHOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN (events);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own webhooks
DROP POLICY IF EXISTS "Users can manage own webhooks" ON webhooks;
CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- AUTO UPDATE updated_at
-- ============================================
DROP TRIGGER IF EXISTS set_webhooks_updated_at ON webhooks;
CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
