-- Migration 000: Create base tables that all other migrations depend on.
-- On a fresh project, run this first before 001-016.

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL,
  business_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expiry TIMESTAMPTZ,
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
-- TRACKING EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert track events" ON quote_events;
CREATE POLICY "Anyone can insert track events" ON quote_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Quote owners can view track events" ON quote_events;
CREATE POLICY "Quote owners can view track events" ON quote_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_events.quote_id AND quotes.user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_quote_events_quote ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_created ON quote_events(created_at);

-- ============================================
-- ADMIN SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS JSON AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_seconds || ' seconds')::INTERVAL;
  v_entry RECORD;
BEGIN
  SELECT * INTO v_entry FROM rate_limits WHERE key = p_key;
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, count, first_seen, updated_at)
    VALUES (p_key, 1, v_now, v_now) RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.first_seen < v_window_start THEN
    UPDATE rate_limits SET count = 1, first_seen = v_now, updated_at = v_now WHERE key = p_key
    RETURNING * INTO v_entry;
    RETURN json_build_object('allowed', true, 'remaining', p_max - 1, 'count', 1);
  END IF;
  IF v_entry.count >= p_max THEN
    RETURN json_build_object('allowed', false, 'remaining', 0, 'retryAfter', CEIL(EXTRACT(EPOCH FROM (v_entry.first_seen + (p_window_seconds || ' seconds')::INTERVAL - v_now))));
  END IF;
  UPDATE rate_limits SET count = count + 1, updated_at = v_now WHERE key = p_key
  RETURNING * INTO v_entry;
  RETURN json_build_object('allowed', true, 'remaining', p_max - v_entry.count, 'count', v_entry.count);
END;
$$ LANGUAGE plpgsql;

-- Soft delete
CREATE OR REPLACE FUNCTION soft_delete_quote(p_quote_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_updated BOOLEAN;
BEGIN
  UPDATE quotes SET deleted_at = NOW(), status = 'expired'
  WHERE id = p_quote_id AND user_id = p_user_id AND deleted_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deduplicate track events
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

CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_increment_coupon ON coupon_usages;
CREATE TRIGGER auto_increment_coupon AFTER INSERT ON coupon_usages FOR EACH ROW EXECUTE FUNCTION increment_coupon_usage();

CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_period_end < NOW() AND NEW.status = 'active' THEN NEW.status := 'expired'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_expire_subscriptions ON subscriptions;
CREATE TRIGGER auto_expire_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION check_subscription_expiry();

-- Storage buckets
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

-- Realtime (idempotent - skip if already added)
DO $$
DECLARE
  v_tables TEXT[] := ARRAY['profiles', 'quotes', 'subscriptions', 'coupons'];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', v_table);
    EXCEPTION WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
    END;
  END LOOP;
END $$;
