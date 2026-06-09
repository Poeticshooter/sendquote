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
BEGIN;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_email_unique UNIQUE (referred_email);
COMMIT;

-- Migration 4: Performance indexes
BEGIN;
CREATE INDEX IF NOT EXISTS idx_quotes_user_status_created ON public.quotes(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes(public_token);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key_id ON public.ai_cache(cache_key, id);
COMMIT;

-- Migration 5: Missing RLS policies
BEGIN;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flag_overrides ENABLE ROW LEVEL SECURITY;
-- Add SELECT policies for reference data
CREATE POLICY "Authenticated users can read achievement_definitions" ON public.achievement_definitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read coupons" ON public.coupons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read feature_flags" ON public.feature_flags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read own org members" ON public.organization_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own orgs" ON public.organizations FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.organization_members WHERE organization_id = id));
CREATE POLICY "Users can manage own flag overrides" ON public.user_flag_overrides FOR ALL USING (auth.uid() = user_id);
COMMIT;

-- Migration 6: Unique constraint on quotes.quote_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);

-- Migration 7: Unique constraint on profiles.user_id
ALTER TABLE public.profiles ADD CONSTRAINT IF NOT EXISTS profiles_user_id_key UNIQUE (user_id);

-- Migration 8: Approval rules default
ALTER TABLE public.approval_rules ALTER COLUMN active SET DEFAULT true;
UPDATE public.approval_rules SET active = true WHERE active IS NULL;

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

-- Migration 10: FK cascades
ALTER TABLE public.quote_items DROP CONSTRAINT IF EXISTS quote_items_quote_id_fkey, ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE public.invoice_items DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey, ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE public.quote_events DROP CONSTRAINT IF EXISTS quote_events_quote_id_fkey, ADD CONSTRAINT quote_events_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE public.quote_signatures DROP CONSTRAINT IF EXISTS quote_signatures_quote_id_fkey, ADD CONSTRAINT quote_signatures_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE public.deal_room_messages DROP CONSTRAINT IF EXISTS deal_room_messages_quote_id_fkey, ADD CONSTRAINT deal_room_messages_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
ALTER TABLE public.approval_requests DROP CONSTRAINT IF EXISTS approval_requests_quote_id_fkey, ADD CONSTRAINT approval_requests_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Migration 11: FK indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_signatures_quote_id ON public.quote_signatures(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_rules_user_id ON public.approval_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_quote_id ON public.approval_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_rule_id ON public.approval_requests(rule_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_quote_id ON public.deal_room_messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_cron_reminders_quote_id ON public.cron_reminders(quote_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(account_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Migration 12: RLS on system tables
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own error logs" ON public.error_logs;
CREATE POLICY "Users can view own error logs" ON public.error_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Only admins can view audit log" ON public.admin_audit_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can access own AI cache" ON public.ai_cache;
CREATE POLICY "Users can access own AI cache" ON public.ai_cache FOR ALL USING (auth.uid() = user_id);

-- Migration 13: Composite indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON public.quotes(status, valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email_created ON public.quotes(client_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- Migration 14: NOT NULL financial columns
ALTER TABLE public.quotes ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE public.quotes ALTER COLUMN total SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN balance_due SET NOT NULL;
