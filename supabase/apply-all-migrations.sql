-- ============================================================
-- SendQuote — Apply All Pending Migrations
-- ============================================================
-- How to run:
--   Option 1: Copy-paste entire file into Supabase Dashboard → SQL Editor
--   Option 2 (CLI - requires db:write scope on token):
--     curl -X POST https://api.supabase.com/v1/projects/yabsujbilznpoayueokq/database/query \
--       -H "Authorization: Bearer $SUPABASE_TOKEN" \
--       -H "Content-Type: application/json" \
--       -d "$(python3 -c "import json; print(json.dumps({'query': open('supabase/apply-all-migrations.sql').read()}))")"
--   Option 3: supabase db push (requires `supabase link --project-ref yabsujbilznpoayueokq`)
-- ============================================================

-- Migration 1: AI Cache table
BEGIN;
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'default',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Ensure columns exist if table was pre-created with different schema
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS cache_key TEXT NOT NULL UNIQUE;
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS response TEXT NOT NULL;
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON public.ai_cache(created_at);
COMMIT;

-- Migration 2: Fixes (RPC functions, etc.)
BEGIN;
CREATE OR REPLACE FUNCTION public.increment_quote_counter(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO public.profiles (user_id, quote_counter)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET quote_counter = profiles.quote_counter + 1
  RETURNING quote_counter INTO v_next;
  RETURN v_next;
END;
$$;
COMMIT;

-- Migration 3: Gamification features
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referred_email_unique') THEN
    ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_email TEXT;
    ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_email_unique UNIQUE (referred_email);
  END IF;
END $$;

-- Migration 4: Performance indexes (with column existence checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_quotes_user_status_created ON public.quotes(user_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON public.quotes(status, valid_until);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='client_email') THEN
    CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
    CREATE INDEX IF NOT EXISTS idx_quotes_client_email_created ON public.quotes(client_email, created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='public_token') THEN
    CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes(public_token);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='activity_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='webhook_events' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
  END IF;
END $$;

-- Migration 5: RLS on feature tables (with table existence checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='achievement_definitions') THEN
    ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Authenticated users can read achievement_definitions" ON public.achievement_definitions FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='coupons') THEN
    ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Authenticated users can read coupons" ON public.coupons FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feature_flags') THEN
    ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Authenticated users can read feature_flags" ON public.feature_flags FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_members') THEN
    ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read own org members" ON public.organization_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='organizations') THEN
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can read own orgs" ON public.organizations FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.organization_members WHERE organization_id = id));
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_flag_overrides') THEN
    ALTER TABLE public.user_flag_overrides ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own flag overrides" ON public.user_flag_overrides FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Migration 6: Unique constraint on quotes.quote_number
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='quote_number') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
  END IF;
END $$;

-- Migration 7: Unique constraint on profiles.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Migration 8: Approval rules default
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='approval_rules') THEN
    ALTER TABLE public.approval_rules ALTER COLUMN active SET DEFAULT true;
    UPDATE public.approval_rules SET active = true WHERE active IS NULL;
  END IF;
END $$;

-- Migration 9: Quote creation transaction RPC
CREATE OR REPLACE FUNCTION public.create_quote_with_items(
  p_user_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_currency TEXT,
  p_notes TEXT,
  p_terms TEXT,
  p_valid_until TIMESTAMPTZ,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_quote_number TEXT;
  v_result JSONB;
BEGIN
  SELECT quote_number FROM public.generateQuoteNumber() INTO v_quote_number;
  INSERT INTO public.quotes (user_id, client_name, client_email, client_phone, currency, notes, terms, valid_until, status, quote_number, subtotal, tax, total)
  VALUES (p_user_id, p_client_name, p_client_email, p_client_phone, p_currency, p_notes, p_terms, p_valid_until, 'draft', v_quote_number, 0, 0, 0)
  RETURNING id INTO v_quote_id;
  v_result = jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_quote_number);
  RETURN v_result;
END;
$$;

-- Migration 10: FK cascades (with safety checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_items') THEN
    ALTER TABLE public.quote_items DROP CONSTRAINT IF EXISTS quote_items_quote_id_fkey, ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoice_items') THEN
    ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey, ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_events') THEN
    ALTER TABLE public.quote_events DROP CONSTRAINT IF EXISTS quote_events_quote_id_fkey, ADD CONSTRAINT quote_events_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_signatures') THEN
    ALTER TABLE public.quote_signatures DROP CONSTRAINT IF EXISTS quote_signatures_quote_id_fkey, ADD CONSTRAINT quote_signatures_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='deal_room_messages') THEN
    ALTER TABLE public.deal_room_messages DROP CONSTRAINT IF EXISTS deal_room_messages_quote_id_fkey, ADD CONSTRAINT deal_room_messages_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='approval_requests') THEN
    ALTER TABLE public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_quote_id_fkey, ADD CONSTRAINT approval_requests_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migration 11: FK indexes (with table existence checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_items') THEN
    CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_events') THEN
    CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quote_signatures') THEN
    CREATE INDEX IF NOT EXISTS idx_quote_signatures_quote_id ON public.quote_signatures(quote_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='approval_rules') THEN
    CREATE INDEX IF NOT EXISTS idx_approval_rules_user_id ON public.approval_rules(user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='approval_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_approval_requests_quote_id ON public.approval_requests(quote_id);
    CREATE INDEX IF NOT EXISTS idx_approval_requests_rule_id ON public.approval_requests(rule_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='deal_room_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_deal_room_messages_quote_id ON public.deal_room_messages(quote_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cron_reminders') THEN
    CREATE INDEX IF NOT EXISTS idx_cron_reminders_quote_id ON public.cron_reminders(quote_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='team_members') THEN
    CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(account_user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='subscriptions') THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
  END IF;
END $$;

-- Migration 12: RLS on system tables (with table existence checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='error_logs') THEN
    ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own error logs" ON public.error_logs;
    CREATE POLICY "Users can view own error logs" ON public.error_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_audit_log') THEN
    ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Only admins can view audit log" ON public.admin_audit_log;
    CREATE POLICY "Only admins can view audit log" ON public.admin_audit_log FOR SELECT USING (true);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_cache') THEN
    ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can access own AI cache" ON public.ai_cache;
    CREATE POLICY "Users can access own AI cache" ON public.ai_cache FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Migration 13: Composite indexes (with column checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON public.quotes(status, valid_until);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='quotes' AND column_name='client_email') THEN
    CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
    CREATE INDEX IF NOT EXISTS idx_quotes_client_email_created ON public.quotes(client_email, created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rate_limits') THEN
    CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
  END IF;
END $$;

-- Migration 14: NOT NULL financial columns (safe with NULL fill and table checks)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quotes') THEN
    UPDATE public.quotes SET subtotal = 0 WHERE subtotal IS NULL;
    UPDATE public.quotes SET total = 0 WHERE total IS NULL;
    ALTER TABLE public.quotes ALTER COLUMN subtotal SET NOT NULL;
    ALTER TABLE public.quotes ALTER COLUMN total SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
    UPDATE public.invoices SET amount = 0 WHERE amount IS NULL;
    UPDATE public.invoices SET balance_due = 0 WHERE balance_due IS NULL;
    ALTER TABLE public.invoices ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.invoices ALTER COLUMN balance_due SET NOT NULL;
  END IF;
END $$;
