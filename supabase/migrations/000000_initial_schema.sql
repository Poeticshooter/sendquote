-- SendQuote Initial Schema
-- Reconstructed from application code, migration files, and type definitions.
-- This file contains the complete base schema for a fresh Supabase project.

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_expiry TIMESTAMPTZ,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  monthly_quote_count INTEGER NOT NULL DEFAULT 0,
  logo_url TEXT,
  phone TEXT,
  gst_number TEXT,
  address TEXT,
  referral_code TEXT,
  upi_id TEXT,
  smtp_email TEXT,
  organization_id UUID,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  quote_counter INTEGER NOT NULL DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own org membership"
  ON public.organization_members FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- QUOTES (core)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to profiles enforced at app layer
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','opened','accepted','changes_requested','expired','archived','lost')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'fixed' CHECK (discount_type IN ('percentage','fixed')),
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  notes TEXT,
  terms TEXT,
  payment_terms TEXT,
  valid_until TIMESTAMPTZ,
  public_token TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  original_status TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quotes_user_status_created ON public.quotes(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status_valid_until ON public.quotes(status, valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email ON public.quotes(client_email);
CREATE INDEX IF NOT EXISTS idx_quotes_client_email_created ON public.quotes(client_email, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  spec TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pc',
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- ============================================================
-- QUOTE EVENTS (analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_type_time ON public.quote_events(quote_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON public.quote_events(quote_id);

-- ============================================================
-- QUOTE SIGNATURES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  signatory_name TEXT NOT NULL,
  signatory_email TEXT,
  signature_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_signatures ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_quote_signatures_quote_id ON public.quote_signatures(quote_id);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  notes TEXT,
  total_quotes INTEGER NOT NULL DEFAULT 0,
  total_invoices INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_quote_date TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_clients_user_email ON public.clients(user_id, email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  amount NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  due_date TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON public.invoices(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUBSCRIPTIONS (Razorpay)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL,
  razorpay_subscription_id TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  last_payment_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_order ON public.subscriptions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub ON public.subscriptions(razorpay_subscription_id);

-- ============================================================
-- ACHIEVEMENT DEFINITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('milestone','engagement','social')),
  threshold INTEGER
);
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements" ON public.achievement_definitions
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement TEXT NOT NULL REFERENCES public.achievement_definitions(key),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, achievement)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','joined','converted','rewarded')),
  reward_months INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referrer_email ON public.referrals(referrer_id, referred_email);

-- ============================================================
-- QUOTE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  suggested_items JSONB NOT NULL DEFAULT '[]',
  suggested_terms TEXT,
  suggested_payment_terms TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON public.quote_templates
  FOR SELECT USING (true);

-- ============================================================
-- FOLLOW-UP SEQUENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.followup_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_days INTEGER[] NOT NULL DEFAULT '{1,3,7}',
  trigger_condition TEXT NOT NULL DEFAULT 'sent' CHECK (trigger_condition IN ('sent','opened_no_response','expiring_soon','expired')),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sequences" ON public.followup_sequences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FOLLOW-UP SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.followup_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','cancelled'))
);
ALTER TABLE public.followup_schedule ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_followup_schedule_status ON public.followup_schedule(status);
CREATE INDEX IF NOT EXISTS idx_followup_schedule_date ON public.followup_schedule(scheduled_at);

-- ============================================================
-- DEAL ROOM MESSAGES (buyer chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deal_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('seller','buyer')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_room_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_quote_id ON public.deal_room_messages(quote_id);

-- ============================================================
-- APPROVAL RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('discount_percent','discount_amount','high_value','custom')),
  trigger_value NUMERIC(12,2),
  approver_email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_approval_rules_user_id ON public.approval_rules(user_id);

-- ============================================================
-- APPROVAL REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.approval_rules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_approval_requests_quote_id ON public.approval_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_rule_id ON public.approval_requests(rule_id);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_user_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','removed')),
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(account_user_id);

-- ============================================================
-- WEBHOOK EVENTS (idempotency log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_event_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT,
  payload JSONB,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(razorpay_event_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time ON public.activity_logs(user_id, created_at DESC);

-- ============================================================
-- CRON REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cron_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cron_reminders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cron_reminders_quote_id ON public.cron_reminders(quote_id);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2),
  discount_amount NUMERIC(12,2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view coupons" ON public.coupons
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read feature flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- USER FLAG OVERRIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, flag_key)
);
ALTER TABLE public.user_flag_overrides ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ERROR LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_type TEXT,
  message TEXT,
  stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID,
  admin_action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE plan IN ('enterprise','pro')));

-- ============================================================
-- AI CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  prompt_hash TEXT NOT NULL,
  system_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'groq',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own AI cache" ON public.ai_cache
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash_lookup ON public.ai_cache(prompt_hash, system_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON public.ai_cache(created_at);

-- ============================================================
-- RATE LIMITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);

-- ============================================================
-- SEED DATA: ACHIEVEMENT DEFINITIONS
-- ============================================================
INSERT INTO public.achievement_definitions (key, label, description, icon, category, threshold) VALUES
  ('first_quote', 'First Quote', 'Created your first quote', '📄', 'milestone', 1),
  ('ten_quotes', 'Getting Started', 'Created 10 quotes', '📊', 'milestone', 10),
  ('fifty_quotes', 'Quote Machine', 'Created 50 quotes', '🚀', 'milestone', 50),
  ('first_accepted', 'First Win', 'Got your first quote accepted', '🏆', 'milestone', 1),
  ('five_accepted', 'Rising Star', 'Got 5 quotes accepted', '⭐', 'milestone', 5),
  ('twenty_accepted', 'Deal Closer', 'Got 20 quotes accepted', '💎', 'milestone', 20),
  ('first_payment', 'Paid!', 'Received your first online payment', '💰', 'milestone', 1),
  ('high_win_rate', 'Sharpshooter', 'Maintain 75%+ win rate (min 10 quotes)', '🎯', 'engagement', 75),
  ('first_client', 'Networker', 'Added your first client', '👥', 'milestone', 1),
  ('ten_clients', 'People Person', 'Added 10 clients', '🤝', 'milestone', 10),
  ('streak_7', 'Weekly Warrior', 'Sent quotes 7 days in a row', '🔥', 'engagement', 7),
  ('streak_30', 'Unstoppable', 'Sent quotes 30 days in a row', '💪', 'engagement', 30),
  ('team_player', 'Team Player', 'Invited a team member', '👨‍👩‍👧‍👦', 'social', 1),
  ('referral_starter', 'Referral Star', 'Referred a friend who joined', '🌟', 'social', 1)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED DATA: QUOTE TEMPLATES
-- ============================================================
INSERT INTO public.quote_templates (name, description, industry, suggested_items, suggested_terms, suggested_payment_terms, is_default) VALUES
  ('Web Development', 'Website and web app development projects', 'technology',
   '[{"description":"Website Development (5 pages)","quantity":1,"rate":50000,"unit":"project"},{"description":"Domain & Hosting Setup","quantity":1,"rate":5000,"unit":"project"},{"description":"SEO Optimization","quantity":1,"rate":15000,"unit":"project"},{"description":"Monthly Maintenance","quantity":1,"rate":5000,"unit":"month"}]',
   'Payment due within 30 days. 50% advance required for new clients.',
   '50% advance, 50% on completion', true),
  ('Consulting Services', 'Business and management consulting', 'consulting',
   '[{"description":"Initial Consultation","quantity":1,"rate":0,"unit":"session"},{"description":"Strategy Development","quantity":40,"rate":3000,"unit":"hour"},{"description":"Implementation Support","quantity":20,"rate":2500,"unit":"hour"},{"description":"Monthly Retainer","quantity":1,"rate":50000,"unit":"month"}]',
   'Cancellation requires 7 days notice. Expenses billed separately.',
   'Net 30', true),
  ('Graphic Design', 'Logo, branding, and design projects', 'design',
   '[{"description":"Logo Design (3 concepts)","quantity":1,"rate":15000,"unit":"project"},{"description":"Brand Guidelines","quantity":1,"rate":25000,"unit":"project"},{"description":"Social Media Kit","quantity":1,"rate":10000,"unit":"set"},{"description":"Business Card Design","quantity":1,"rate":3000,"unit":"design"}]',
   'Up to 2 rounds of revisions included.',
   '50% advance, 50% on delivery', true),
  ('IT Support', 'Managed IT services and support', 'technology',
   '[{"description":"IT Setup & Configuration","quantity":1,"rate":10000,"unit":"project"},{"description":"Monthly Support (up to 10 hrs)","quantity":1,"rate":8000,"unit":"month"},{"description":"Emergency Support (per incident)","quantity":1,"rate":2000,"unit":"incident"},{"description":"Cloud Backup Setup","quantity":1,"rate":5000,"unit":"project"}]',
   'Support hours: Mon-Fri 9am-6pm.',
   'Net 15', true),
  ('Content Writing', 'Blog posts, articles, and copywriting', 'marketing',
   '[{"description":"Blog Post (1000-1500 words)","quantity":1,"rate":5000,"unit":"post"},{"description":"SEO Keyword Research","quantity":1,"rate":3000,"unit":"project"},{"description":"Social Media Copy (5 posts)","quantity":1,"rate":5000,"unit":"set"},{"description":"Newsletter Copy","quantity":1,"rate":3000,"unit":"issue"}]',
   '2 rounds of revisions included.',
   '100% upfront for new clients', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: DEFAULT FOLLOW-UP SEQUENCES
-- ============================================================
INSERT INTO public.followup_sequences (user_id, name, trigger_days, trigger_condition, subject_template, body_template, is_active) VALUES
  (NULL, 'Standard Follow-up', '{3,7}', 'sent',
   'Following up on your quote {{quote_number}}',
   'Hi {{client_name}},\n\nI wanted to follow up on the quote I sent you ({{quote_number}}) for {{total}}. Have you had a chance to review it?\n\nIf you have any questions or would like to discuss further, I''m happy to help.\n\nBest regards,\n{{business_name}}',
   true),
  (NULL, 'Gentle Reminder', '{5,10}', 'opened_no_response',
   'Checking in on {{quote_number}}',
   'Hi {{client_name}},\n\nI noticed you viewed the quote ({{quote_number}}) a few days ago. Just checking if you have any questions or need any clarification on the pricing or terms.\n\nHappy to hop on a quick call if that helps.\n\nBest,\n{{business_name}}',
   true),
  (NULL, 'Expiry Notice', '{3}', 'expiring_soon',
   'Your quote {{quote_number}} is expiring soon',
   'Hi {{client_name}},\n\nThis is a quick reminder that quote {{quote_number}} for {{total}} is expiring in 3 days.\n\nTo lock in the current pricing, please accept before {{valid_until}}.\n\nBest,\n{{business_name}}',
   true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: DEFAULT POLICIES FOR QUOTES (owner access)
-- ============================================================
CREATE POLICY "Users can read own quotes" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes" ON public.quotes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes" ON public.quotes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own quote items" ON public.quote_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND user_id = auth.uid()));
CREATE POLICY "Users can read own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- RPC: increment_quote_counter (atomic counter for quote numbers)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_quote_counter(user_id UUID)
RETURNS TABLE (quote_counter BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  UPDATE public.profiles
  SET quote_counter = COALESCE(quote_counter, 0) + 1
  WHERE profiles.user_id = $1
  RETURNING quote_counter INTO next_val;

  IF NOT FOUND THEN
    INSERT INTO public.profiles (user_id, quote_counter)
    VALUES ($1, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET quote_counter = public.profiles.quote_counter + 1
    RETURNING quote_counter INTO next_val;
  END IF;

  RETURN QUERY SELECT next_val;
END;
$$;

-- ============================================================
-- RPC: increment_rate_limit (atomic rate limit counter)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_ms INTEGER
) RETURNS TABLE(allowed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  SELECT reset_at INTO v_reset_at FROM public.rate_limits WHERE key = p_key;

  IF v_reset_at IS NULL OR now() > v_reset_at THEN
    v_reset_at := now() + (p_window_ms || ' milliseconds')::INTERVAL;
    INSERT INTO public.rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at)
    ON CONFLICT (key) DO UPDATE SET
      count = 1,
      reset_at = v_reset_at
    RETURNING count INTO v_count;
    RETURN QUERY SELECT true AS allowed;
    RETURN;
  END IF;

  UPDATE public.rate_limits
  SET count = count + 1
  WHERE key = p_key
  RETURNING count INTO v_count;

  RETURN QUERY SELECT (v_count <= p_max_requests) AS allowed;
END;
$$;
