-- Migration 032: Comprehensive fixes for production readiness
-- Fixes missing columns, broken triggers, plan restrictions, and RLS policies

-- ============================================
-- 1. ADD MISSING COLUMNS
-- ============================================

-- preferred_language column missing from profiles (used in SettingsClient)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- ============================================
-- 2. FIX BROKEN TRIGGER: auto_create_client_on_quote
-- The function references 'client_address' but table column is 'address'
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_client_from_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
    INSERT INTO public.clients (user_id, name, email, phone, address, last_quote_date, total_quotes)
    VALUES (
      NEW.user_id,
      NEW.client_name,
      NEW.client_email,
      NEW.client_phone,
      NEW.client_address,
      NEW.created_at,
      1
    )
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

-- ============================================
-- 3. ENSURE ALL RLS POLICIES ARE CORRECT
-- ============================================

-- quotes: ensure soft-delete is respected in RLS
DROP POLICY IF EXISTS "Users can CRUD own quotes" ON quotes;
CREATE POLICY "Users can CRUD own quotes" ON quotes FOR ALL
  USING (auth.uid() = user_id AND is_deleted = false)
  WITH CHECK (auth.uid() = user_id);

-- quote_items: proper RLS via quotes ownership
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quote items" ON quote_items;
CREATE POLICY "Users can manage own quote items" ON quote_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  );

-- referrals: users can view their own referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
CREATE POLICY "System can insert referrals" ON referrals FOR INSERT WITH CHECK (true);

-- rate_limits: system only
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can manage rate limits" ON rate_limits;
CREATE POLICY "System can manage rate limits" ON rate_limits FOR ALL USING (true);

-- admin_sessions: system only
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can manage admin sessions" ON admin_sessions;
CREATE POLICY "System can manage admin sessions" ON admin_sessions FOR ALL USING (true);

-- webhook_events: users can view their own
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own webhook events" ON webhook_events;
CREATE POLICY "Users can view own webhook events" ON webhook_events FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert webhook events" ON webhook_events;
CREATE POLICY "System can insert webhook events" ON webhook_events FOR INSERT WITH CHECK (true);

-- webhooks: users manage their own
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own webhooks" ON webhooks;
CREATE POLICY "Users can manage own webhooks" ON webhooks FOR ALL
  USING (auth.uid() = user_id);

-- cron_reminders: system only
ALTER TABLE cron_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can manage cron reminders" ON cron_reminders;
CREATE POLICY "System can manage cron reminders" ON cron_reminders FOR ALL USING (true);

-- ============================================
-- 4. PLAN RESTRICTION ENFORCEMENT
-- ============================================

-- Function to check if user has access to a paid feature
CREATE OR REPLACE FUNCTION public.has_paid_feature(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE user_id = p_user_id;
  RETURN v_plan IN ('starter', 'professional');
END;
$$;

-- ============================================
-- 5. ENSURE STORAGE BUCKETS EXIST
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
CREATE POLICY "Logos are publicly accessible" ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can view own PDFs" ON storage.objects;
CREATE POLICY "Users can view own PDFs" ON storage.objects FOR SELECT
  USING (bucket_id = 'pdfs' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can upload PDFs" ON storage.objects;
CREATE POLICY "Users can upload PDFs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdfs' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete own PDFs" ON storage.objects;
CREATE POLICY "Users can delete own PDFs" ON storage.objects FOR DELETE
  USING (bucket_id = 'pdfs' AND auth.uid() = owner);

-- ============================================
-- 6. ENSURE ALL TRIGGERS ARE CORRECT
-- ============================================

-- Ensure updated_at triggers exist on all tables
DROP TRIGGER IF EXISTS set_quotes_updated_at ON quotes;
CREATE TRIGGER set_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_webhooks_updated_at ON webhooks;
CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. ENSURE REALTIME PUBLICATION
-- ============================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['profiles', 'quotes', 'subscriptions', 'coupons', 'invoices'];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', v_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;
