-- SendQuote Database Schema
-- Project: ytjbzvokmbbnhkhechhi
-- Run this in Supabase SQL Editor after creating a new project
-- Generated from migrations 000-019

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL,
  business_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expiry TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly',
  monthly_quote_count INTEGER NOT NULL DEFAULT 0,
  last_quote_reset TIMESTAMPTZ,
  invoice_counter INTEGER NOT NULL DEFAULT 0,
  logo_url TEXT,
  phone TEXT,
  gst_number TEXT,
  address TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id),
  voice_enabled BOOLEAN DEFAULT false,
  voice_language TEXT DEFAULT 'en',
  tts_rate INTEGER DEFAULT 0,
  upi_id TEXT,
  smtp_email TEXT,
  smtp_app_password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- QUOTES
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','opened','accepted','changes_requested','expired')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  payment_terms TEXT,
  internal_notes TEXT,
  tags TEXT[],
  template_name TEXT,
  is_template BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  valid_until TIMESTAMPTZ,
  public_token TEXT UNIQUE,
  unique_token TEXT UNIQUE,
  parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  original_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own quotes" ON quotes;
CREATE POLICY "Users can CRUD own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_parent ON quotes(parent_quote_id) WHERE parent_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_version ON quotes(user_id, quote_number, version);
CREATE INDEX IF NOT EXISTS idx_quotes_deleted ON quotes(is_deleted) WHERE is_deleted = true;
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_user_created ON quotes(user_id, created_at DESC);

-- ============================================
-- QUOTE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  spec TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pc',
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  client_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  subtotal NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  gst_rate NUMERIC(5,2) DEFAULT 0,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  terms TEXT,
  notes TEXT,
  payment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own invoices" ON invoices;
CREATE POLICY "Users can CRUD own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_created ON invoices(user_id, created_at DESC);

-- ============================================
-- INVOICE ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  spec TEXT DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'nos',
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort ON invoice_items(invoice_id, sort_order);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own invoice items" ON invoice_items;
CREATE POLICY "Users can manage own invoice items" ON invoice_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'bank_transfer',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their payments" ON payments;
CREATE POLICY "Users own their payments" ON payments FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()))
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'starter',
  billing_cycle TEXT DEFAULT 'monthly',
  base_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','cancelled','expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  coupon_code TEXT,
  coupon_discount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ============================================
-- QUOTE EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'accepted', 'changes_requested', 'expired', 'sent', 'viewed')),
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_events_created ON quote_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_type ON quote_events(quote_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_events_dedup ON quote_events (quote_id, event_type, created_at);

ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quote owners can view events" ON quote_events;
CREATE POLICY "Quote owners can view events" ON quote_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_events.quote_id AND quotes.user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert quote events" ON quote_events;
CREATE POLICY "Anyone can insert quote events" ON quote_events FOR INSERT WITH CHECK (true);

-- ============================================
-- ADMIN SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- ============================================
-- RATE LIMITS
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all_plans' CHECK (applies_to IN ('all_plans', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'both' CHECK (billing_cycle IN ('monthly', 'annual', 'both')),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  discount_applied NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS coupon_usages_read_own ON coupon_usages;
CREATE POLICY coupon_usages_read_own ON coupon_usages FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- CRON REMINDERS
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

DROP POLICY IF EXISTS "Admins can read cron reminders" ON cron_reminders;
CREATE POLICY "Admins can read cron reminders" ON cron_reminders FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can manage cron reminders" ON cron_reminders;
CREATE POLICY "System can manage cron reminders" ON cron_reminders FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ACTIVITY LOGS
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

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
CREATE POLICY "Users can view own activity logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity logs" ON activity_logs;
CREATE POLICY "Admins can view all activity logs" ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "System can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
CREATE POLICY "Users can view own analytics" ON analytics_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert analytics" ON analytics_events;
CREATE POLICY "System can insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);

-- ============================================
-- ERROR LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  message TEXT,
  stack TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view error logs" ON error_logs;
CREATE POLICY "Admins can view error logs" ON error_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;
CREATE POLICY "System can insert error logs" ON error_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  notes TEXT,
  total_quotes INTEGER NOT NULL DEFAULT 0,
  total_invoices INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_quote_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_name ON clients(user_id, name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own clients" ON clients;
CREATE POLICY "Users can CRUD own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TEAM MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invite_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_account ON team_members(account_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_token ON team_members(invite_token) WHERE invite_token IS NOT NULL;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account owners can manage team" ON team_members;
CREATE POLICY "Account owners can manage team" ON team_members FOR ALL
  USING (auth.uid() = account_user_id);

DROP POLICY IF EXISTS "Members can view own membership" ON team_members;
CREATE POLICY "Members can view own membership" ON team_members FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- WEBHOOKS
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

DROP POLICY IF EXISTS "Users can manage own webhooks" ON webhooks;
CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- WEBHOOK EVENTS (idempotency tracking)
-- ============================================
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

DROP POLICY IF EXISTS "System manages webhook events" ON webhook_events;
CREATE POLICY "System manages webhook events" ON webhook_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_quotes_updated_at ON quotes;
CREATE TRIGGER set_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_team_members_updated_at ON team_members;
CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_webhooks_updated_at ON webhooks;
CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, user_id, business_name, plan)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment monthly quote count
CREATE OR REPLACE FUNCTION increment_monthly_quote_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET monthly_quote_count = monthly_quote_count + 1 WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting (check_rate_limit)
CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS JSON AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  v_entry RECORD;
BEGIN
  SELECT * INTO v_entry FROM rate_limits WHERE key = p_key;
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, first_seen, updated_at) VALUES (p_key, 1, v_now, v_now) RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.first_seen < v_window_start THEN
    UPDATE rate_limits SET count = 1, first_seen = v_now, updated_at = v_now WHERE key = p_key RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.count >= p_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0, 'retryAfter', CEIL(EXTRACT(EPOCH FROM (v_entry.first_seen + (p_window_seconds || ' seconds')::INTERVAL - v_now))));
  END IF;
  UPDATE rate_limits SET count = count + 1, updated_at = v_now WHERE key = p_key RETURNING * INTO v_entry;
  RETURN json_build_object('allowed', true, 'remaining', p_max - v_entry.count, 'count', v_entry.count);
END;
$$ LANGUAGE plpgsql;

-- Rate limiting (upsert_rate_limit - used by TypeScript code)
CREATE OR REPLACE FUNCTION upsert_rate_limit(p_key TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS JSON AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  v_entry RECORD;
BEGIN
  SELECT * INTO v_entry FROM rate_limits WHERE key = p_key;
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, first_seen, updated_at) VALUES (p_key, 1, v_now, v_now) RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.first_seen < v_window_start THEN
    UPDATE rate_limits SET count = 1, first_seen = v_now, updated_at = v_now WHERE key = p_key RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.count >= p_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0, 'retryAfter', CEIL(EXTRACT(EPOCH FROM (v_entry.first_seen + (p_window_seconds || ' seconds')::INTERVAL - v_now))));
  END IF;
  UPDATE rate_limits SET count = count + 1, updated_at = v_now WHERE key = p_key RETURNING * INTO v_entry;
  RETURN json_build_object('allowed', true, 'remaining', p_max - v_entry.count, 'count', v_entry.count);
END;
$$ LANGUAGE plpgsql;

-- Soft delete
CREATE OR REPLACE FUNCTION soft_delete_quote(p_quote_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_updated BOOLEAN;
BEGIN
  UPDATE quotes SET deleted_at = NOW(), status = 'expired' WHERE id = p_quote_id AND user_id = p_user_id AND deleted_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduplicate quote events
CREATE OR REPLACE FUNCTION deduplicate_quote_events(p_quote_id UUID, p_event_type TEXT, p_ip TEXT, p_user_agent TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM quote_events WHERE quote_id = p_quote_id AND event_type = p_event_type AND ip = p_ip AND created_at > NOW() - INTERVAL '5 minutes') INTO v_exists;
  IF v_exists THEN RETURN FALSE; END IF;
  INSERT INTO quote_events (quote_id, event_type, ip, user_agent) VALUES (p_quote_id, p_event_type, p_ip, p_user_agent);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Coupon validation
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_plan TEXT, p_billing_cycle TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE code = UPPER(p_code) AND active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses);
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon'); END IF;
  IF v_coupon.applies_to != 'all_plans' AND v_coupon.applies_to != p_plan THEN RETURN jsonb_build_object('valid', false, 'error', 'Coupon does not apply to this plan'); END IF;
  IF v_coupon.billing_cycle != 'both' AND v_coupon.billing_cycle != p_billing_cycle THEN RETURN jsonb_build_object('valid', false, 'error', 'Coupon does not apply to this billing cycle'); END IF;
  RETURN jsonb_build_object('valid', true, 'code', v_coupon.code, 'discount_type', v_coupon.discount_type, 'discount_value', v_coupon.discount_value, 'description', v_coupon.description);
END;
$$;

-- Apply coupon
CREATE OR REPLACE FUNCTION apply_coupon(p_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE code = UPPER(p_code) AND active = true AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses);
  RETURN FOUND;
END;
$$;

-- Auto increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_increment_coupon ON coupon_usages;
CREATE TRIGGER auto_increment_coupon AFTER INSERT ON coupon_usages FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

-- Auto expire subscriptions
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_period_end < NOW() AND NEW.status = 'active' THEN NEW.status := 'expired'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_expire_subscriptions ON subscriptions;
CREATE TRIGGER auto_expire_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION check_subscription_expiry();

-- Invoice balance calculation
CREATE OR REPLACE FUNCTION calc_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO NEW.paid_amount FROM payments WHERE invoice_id = NEW.invoice_id;
  NEW.balance_due := COALESCE(NEW.total, NEW.subtotal, 0) - NEW.paid_amount;
  IF NEW.balance_due <= 0 AND NEW.paid_amount > 0 THEN NEW.status := 'paid';
  ELSIF NEW.due_date < NOW() AND NEW.status = 'pending' THEN NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_balance ON invoices;
CREATE TRIGGER trg_invoice_balance BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION calc_invoice_balance();

-- Create quote with items (atomic)
CREATE OR REPLACE FUNCTION create_quote_with_items(
  p_user_id UUID, p_quote_number TEXT, p_unique_token TEXT,
  p_client_name TEXT, p_client_email TEXT, p_client_phone TEXT, p_client_address TEXT,
  p_valid_till DATE, p_payment_terms TEXT,
  p_subtotal NUMERIC, p_discount NUMERIC, p_discount_type TEXT,
  p_gst_rate NUMERIC, p_gst_amount NUMERIC, p_total NUMERIC,
  p_notes TEXT, p_terms TEXT, p_status TEXT, p_items JSONB
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_quote_id UUID; v_item JSONB;
BEGIN
  INSERT INTO quotes (user_id, quote_number, unique_token, client_name, client_email, client_phone, client_address, valid_until, payment_terms, subtotal, discount, discount_type, gst_rate, gst_amount, total, notes, terms, status)
  VALUES (p_user_id, p_quote_number, p_unique_token, p_client_name, p_client_email, p_client_phone, p_client_address, p_valid_till, p_payment_terms, p_subtotal, p_discount, p_discount_type, p_gst_rate, p_gst_amount, p_total, p_notes, p_terms, p_status)
  RETURNING id INTO v_quote_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO quote_items (quote_id, description, spec, quantity, unit, rate, amount, sort_order)
    VALUES (v_quote_id, v_item->>'description', COALESCE(v_item->>'spec', ''), (v_item->>'quantity')::NUMERIC, v_item->>'unit', (v_item->>'rate')::NUMERIC, (v_item->>'amount')::NUMERIC, (v_item->>'sort_order')::INT);
  END LOOP;
  RETURN v_quote_id;
END;
$$;

-- Sync quote items from JSONB
CREATE OR REPLACE FUNCTION sync_quote_items_from_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM quote_items WHERE quote_id = NEW.id;
  INSERT INTO quote_items (quote_id, description, spec, quantity, unit, rate, amount, sort_order)
  SELECT NEW.id, item->>'description', COALESCE(item->>'spec', ''), (item->>'quantity')::INTEGER, COALESCE(item->>'unit', 'pc'), (item->>'rate')::NUMERIC, (item->>'amount')::NUMERIC, (item->>'sort_order')::INTEGER
  FROM jsonb_array_elements(NEW.items) AS item;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_quote_items_trigger ON quotes;
CREATE TRIGGER sync_quote_items_trigger AFTER INSERT OR UPDATE OF items ON quotes FOR EACH ROW WHEN (NEW.items IS NOT NULL AND NEW.items != '[]'::jsonb) EXECUTE FUNCTION sync_quote_items_from_jsonb();

-- Auto create client from quote
CREATE OR REPLACE FUNCTION upsert_client_from_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
    INSERT INTO clients (user_id, name, email, phone, address, last_quote_date, total_quotes)
    VALUES (NEW.user_id, NEW.client_name, NEW.client_email, NEW.client_phone, NEW.client_address, NEW.created_at, 1)
    ON CONFLICT (user_id, name) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, clients.email),
      phone = COALESCE(EXCLUDED.phone, clients.phone),
      address = COALESCE(EXCLUDED.address, clients.address),
      last_quote_date = GREATEST(clients.last_quote_date, EXCLUDED.last_quote_date),
      total_quotes = clients.total_quotes + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_client_on_quote ON quotes;
CREATE TRIGGER auto_create_client_on_quote AFTER INSERT ON quotes FOR EACH ROW EXECUTE FUNCTION upsert_client_from_quote();

-- Admin RPC functions
CREATE OR REPLACE FUNCTION get_quote_admin(p_id UUID)
RETURNS SETOF quotes LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT * FROM quotes WHERE id = p_id; END;
$$;

CREATE OR REPLACE FUNCTION get_profile_admin(p_user_id UUID)
RETURNS SETOF profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT * FROM profiles WHERE user_id = p_user_id; END;
$$;

CREATE OR REPLACE FUNCTION get_quote_items(p_quote_id UUID)
RETURNS SETOF quote_items LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT * FROM quote_items WHERE quote_id = p_quote_id ORDER BY sort_order; END;
$$;

CREATE OR REPLACE FUNCTION record_quote_action(p_token TEXT, p_action TEXT, p_notes TEXT DEFAULT '')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_quote_id UUID;
BEGIN
  SELECT id INTO v_quote_id FROM quotes WHERE unique_token = p_token;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  INSERT INTO quote_events (quote_id, event_type, metadata) VALUES (v_quote_id, p_action, jsonb_build_object('notes', p_notes));
  UPDATE quotes SET status = 'sent', updated_at = NOW() WHERE id = v_quote_id AND status = 'draft';
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION next_quote_number(p_user_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COALESCE(monthly_quote_count, 0) + 1 INTO v_count FROM profiles WHERE user_id = p_user_id;
  RETURN 'QS-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION purge_soft_deleted_quotes()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM quotes WHERE is_deleted = true AND deleted_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION downgrade_expired_plans()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE profiles SET plan = 'free', plan_expiry = NULL, plan_expires_at = NULL, billing_cycle = 'monthly'
  WHERE plan != 'free' AND plan_expiry IS NOT NULL AND plan_expiry < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION check_team_limit(p_account_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_plan TEXT; v_member_count INTEGER; v_limit INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE user_id = p_account_user_id;
  v_limit := CASE v_plan WHEN 'professional' THEN 5 WHEN 'starter' THEN 1 ELSE 0 END;
  SELECT COUNT(*) INTO v_member_count FROM team_members WHERE account_user_id = p_account_user_id AND status != 'removed';
  RETURN jsonb_build_object('allowed', v_member_count < v_limit, 'current', v_member_count, 'limit', v_limit, 'plan', v_plan);
END;
$$;

CREATE OR REPLACE FUNCTION create_invoice_from_quote(p_quote_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_quote RECORD; v_invoice_id UUID; v_invoice_number TEXT; v_item RECORD; v_profile RECORD;
BEGIN
  SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO v_profile FROM profiles WHERE user_id = v_quote.user_id;
  v_invoice_number := 'INV-' || LPAD(COALESCE(v_profile.invoice_counter, 0) + 1::TEXT, 4, '0');
  INSERT INTO invoices (user_id, quote_id, invoice_number, client_name, client_email, client_phone, client_address, subtotal, discount, discount_type, gst_rate, gst_amount, total, paid_amount, balance_due, terms, notes, payment_terms, due_date, status)
  VALUES (v_quote.user_id, v_quote.id, v_invoice_number, v_quote.client_name, v_quote.client_email, v_quote.client_phone, v_quote.client_address, v_quote.subtotal, v_quote.discount, v_quote.discount_type, v_quote.gst_rate, v_quote.gst_amount, v_quote.total, 0, v_quote.total, v_quote.terms, v_quote.notes, v_quote.payment_terms, NOW() + INTERVAL '30 days', 'pending')
  RETURNING id INTO v_invoice_id;
  FOR v_item IN SELECT description, spec, quantity, unit, rate, amount, sort_order FROM quote_items WHERE quote_id = p_quote_id ORDER BY sort_order LOOP
    INSERT INTO invoice_items (invoice_id, description, spec, quantity, unit, rate, amount, sort_order)
    VALUES (v_invoice_id, v_item.description, v_item.spec, v_item.quantity, v_item.unit, v_item.rate, v_item.amount, v_item.sort_order);
  END LOOP;
  UPDATE profiles SET invoice_counter = COALESCE(invoice_counter, 0) + 1 WHERE user_id = v_quote.user_id;
  UPDATE quotes SET status = 'accepted' WHERE id = p_quote_id;
  RETURN v_invoice_id;
END;
$$;

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
CREATE POLICY "Logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can view own PDFs" ON storage.objects;
CREATE POLICY "Users can view own PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can upload PDFs" ON storage.objects;
CREATE POLICY "Users can upload PDFs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid() = owner);

-- ============================================
-- REALTIME PUBLICATION (idempotent)
-- ============================================
DO $$
DECLARE v_tables TEXT[] := ARRAY['profiles', 'quotes', 'subscriptions', 'coupons']; v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', v_table);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
