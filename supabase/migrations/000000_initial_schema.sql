
-- COMPLETE PRODUCTION SCHEMA DUMP
-- Generated: 2026-06-11T16:08:43Z


-- ========== achievement_definitions ==========
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  key text NOT NULL,
  label text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  threshold integer
);
ALTER TABLE ONLY public.achievement_definitions ADD CONSTRAINT achievement_definitions_pkey PRIMARY KEY (key);

-- ========== activity_logs ==========
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.activity_logs ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ========== admin_audit_log ==========
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);

-- ========== admin_sessions ==========
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.admin_sessions ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.admin_sessions ADD CONSTRAINT admin_sessions_token_key UNIQUE (token);

-- ========== ai_cache ==========
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  prompt_hash text NOT NULL,
  system_hash text NOT NULL,
  response text NOT NULL,
  provider text DEFAULT 'groq'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid,
  cache_key text NOT NULL,
  model text DEFAULT 'default'::text NOT NULL
);
ALTER TABLE ONLY public.ai_cache ADD CONSTRAINT ai_cache_cache_key_key UNIQUE (cache_key);
ALTER TABLE ONLY public.ai_cache ADD CONSTRAINT ai_cache_pkey PRIMARY KEY (id);

-- ========== analytics_events ==========
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.analytics_events ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.analytics_events ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ========== approval_requests ==========
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid NOT NULL,
  rule_id uuid,
  requested_by uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  reviewer_id uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone
);
ALTER TABLE ONLY public.approval_requests ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_requests ADD CONSTRAINT approval_requests_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.approval_requests ADD CONSTRAINT approval_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.approval_requests ADD CONSTRAINT approval_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.approval_requests ADD CONSTRAINT approval_requests_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES approval_rules(id) ON DELETE SET NULL;

-- ========== approval_rules ==========
CREATE TABLE IF NOT EXISTS public.approval_rules (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_value numeric DEFAULT 0 NOT NULL,
  approver_role text DEFAULT 'manager'::text NOT NULL,
  action text DEFAULT 'notify'::text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.approval_rules ADD CONSTRAINT approval_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.approval_rules ADD CONSTRAINT approval_rules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== clients ==========
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  gst_number text,
  notes text,
  total_quotes integer DEFAULT 0 NOT NULL,
  total_invoices integer DEFAULT 0 NOT NULL,
  total_revenue numeric DEFAULT 0 NOT NULL,
  last_quote_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  organization_id uuid
);
ALTER TABLE ONLY public.clients ADD CONSTRAINT clients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.clients ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.clients ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== coupon_usages ==========
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  coupon_id uuid,
  user_id uuid,
  subscription_id uuid,
  discount_applied numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- ========== coupons ==========
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  applies_to text DEFAULT 'all_plans'::text NOT NULL,
  billing_cycle text DEFAULT 'both'::text NOT NULL,
  max_uses integer,
  used_count integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid
);
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);

-- ========== cron_reminders ==========
CREATE TABLE IF NOT EXISTS public.cron_reminders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid,
  reminder_type text NOT NULL,
  sent_at timestamp with time zone DEFAULT now() NOT NULL,
  invoice_id uuid
);
ALTER TABLE ONLY public.cron_reminders ADD CONSTRAINT cron_reminders_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cron_reminders ADD CONSTRAINT cron_reminders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cron_reminders ADD CONSTRAINT cron_reminders_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- ========== deal_room_messages ==========
CREATE TABLE IF NOT EXISTS public.deal_room_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid NOT NULL,
  sender_type text NOT NULL,
  sender_name text DEFAULT ''::text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.deal_room_messages ADD CONSTRAINT deal_room_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.deal_room_messages ADD CONSTRAINT deal_room_messages_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- ========== email_templates ==========
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  template_key text NOT NULL,
  subject text DEFAULT ''::text NOT NULL,
  body_html text DEFAULT ''::text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.email_templates ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_templates ADD CONSTRAINT email_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.email_templates ADD CONSTRAINT email_templates_user_id_template_key_key UNIQUE (user_id, template_key);

-- ========== error_logs ==========
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  page text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  route text,
  error_code text,
  method text,
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE ONLY public.error_logs ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.error_logs ADD CONSTRAINT error_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ========== feature_flags ==========
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  flag_key text NOT NULL,
  description text,
  globally_enabled boolean DEFAULT false NOT NULL,
  plan_overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.feature_flags ADD CONSTRAINT feature_flags_flag_key_key UNIQUE (flag_key);
ALTER TABLE ONLY public.feature_flags ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);

-- ========== feedback ==========
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  message text NOT NULL,
  rating integer,
  category text NOT NULL,
  page text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.feedback ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== followup_schedule ==========
CREATE TABLE IF NOT EXISTS public.followup_schedule (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid NOT NULL,
  sequence_id uuid NOT NULL,
  step integer DEFAULT 1 NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending'::text NOT NULL
);
ALTER TABLE ONLY public.followup_schedule ADD CONSTRAINT followup_schedule_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.followup_schedule ADD CONSTRAINT followup_schedule_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.followup_schedule ADD CONSTRAINT followup_schedule_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES followup_sequences(id) ON DELETE CASCADE;

-- ========== followup_sequences ==========
CREATE TABLE IF NOT EXISTS public.followup_sequences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  name text NOT NULL,
  trigger_days ARRAY DEFAULT '{1,3,7}'::integer[] NOT NULL,
  trigger_condition text DEFAULT 'sent'::text NOT NULL,
  subject_template text NOT NULL,
  body_template text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.followup_sequences ADD CONSTRAINT followup_sequences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.followup_sequences ADD CONSTRAINT followup_sequences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== invoice_items ==========
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  invoice_id uuid NOT NULL,
  description text NOT NULL,
  spec text DEFAULT ''::text,
  quantity integer DEFAULT 1 NOT NULL,
  unit text DEFAULT 'nos'::text,
  rate numeric DEFAULT 0 NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);
ALTER TABLE ONLY public.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invoice_items ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);

-- ========== invoices ==========
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  quote_id uuid,
  invoice_number text NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_address text,
  client_phone text,
  amount numeric NOT NULL,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  discount_type text DEFAULT 'percentage'::text,
  gst_rate numeric DEFAULT 0,
  gst_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  balance_due numeric DEFAULT 0 NOT NULL,
  terms text,
  notes text,
  payment_terms text,
  status text DEFAULT 'pending'::text NOT NULL,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  total numeric,
  tax numeric DEFAULT 0,
  organization_id uuid
);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_quote_id_key UNIQUE (quote_id);
ALTER TABLE ONLY public.invoices ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== leads ==========
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  source text DEFAULT 'landing_page'::text,
  status text DEFAULT 'new'::text,
  referred_by text,
  notes text,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.leads ADD CONSTRAINT leads_email_key UNIQUE (email);
ALTER TABLE ONLY public.leads ADD CONSTRAINT leads_pkey PRIMARY KEY (id);

-- ========== organization_members ==========
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text NOT NULL,
  invited_at timestamp with time zone,
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.organization_members ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.organization_members ADD CONSTRAINT organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id);
ALTER TABLE ONLY public.organization_members ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- ========== organizations ==========
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text,
  owner_id uuid,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.organizations ADD CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) REFERENCES profiles(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);

-- ========== payments ==========
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  invoice_id uuid NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  payment_date date DEFAULT CURRENT_DATE NOT NULL,
  payment_method text DEFAULT 'bank_transfer'::text,
  notes text DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  organization_id uuid
);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

-- ========== profiles ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  business_name text,
  plan text DEFAULT 'free'::text NOT NULL,
  plan_expiry timestamp with time zone,
  billing_cycle text DEFAULT 'monthly'::text,
  monthly_quote_count integer DEFAULT 0 NOT NULL,
  last_quote_reset timestamp with time zone,
  invoice_counter integer DEFAULT 0 NOT NULL,
  logo_url text,
  phone text,
  gst_number text,
  address text,
  referral_code text,
  referred_by uuid,
  voice_enabled boolean DEFAULT false,
  voice_language text DEFAULT 'en'::text,
  tts_rate integer DEFAULT 0,
  upi_id text,
  smtp_email text,
  smtp_app_password text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  plan_expires_at timestamp with time zone,
  beta_voice_assistant boolean DEFAULT false NOT NULL,
  preferred_language text DEFAULT 'en'::text,
  suspended boolean DEFAULT false NOT NULL,
  organization_id uuid,
  subscription_status text DEFAULT 'active'::text,
  quote_counter integer DEFAULT 0
);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- ========== quote_events ==========
CREATE TABLE IF NOT EXISTS public.quote_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid NOT NULL,
  event_type text NOT NULL,
  ip text,
  user_agent text,
  device_type text,
  notes text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.quote_events ADD CONSTRAINT quote_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_events ADD CONSTRAINT quote_events_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- ========== quote_items ==========
CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid,
  description text NOT NULL,
  spec text DEFAULT ''::text,
  quantity integer DEFAULT 1 NOT NULL,
  unit text DEFAULT 'pc'::text,
  rate numeric DEFAULT 0 NOT NULL,
  amount numeric DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);
ALTER TABLE ONLY public.quote_items ADD CONSTRAINT quote_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_items ADD CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- ========== quote_signatures ==========
CREATE TABLE IF NOT EXISTS public.quote_signatures (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quote_id uuid NOT NULL,
  signatory_name text DEFAULT ''::text NOT NULL,
  signatory_email text,
  signature_data text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.quote_signatures ADD CONSTRAINT quote_signatures_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quote_signatures ADD CONSTRAINT quote_signatures_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- ========== quote_templates ==========
CREATE TABLE IF NOT EXISTS public.quote_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  industry text NOT NULL,
  suggested_items jsonb DEFAULT '[]'::jsonb NOT NULL,
  suggested_terms text,
  suggested_payment_terms text,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.quote_templates ADD CONSTRAINT quote_templates_pkey PRIMARY KEY (id);

-- ========== quotes ==========
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  quote_number text NOT NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_address text,
  status text DEFAULT 'draft'::text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  subtotal numeric DEFAULT 0 NOT NULL,
  tax numeric DEFAULT 0 NOT NULL,
  discount numeric DEFAULT 0 NOT NULL,
  discount_type text DEFAULT 'percentage'::text NOT NULL,
  gst_rate numeric DEFAULT 0 NOT NULL,
  gst_amount numeric DEFAULT 0 NOT NULL,
  total numeric DEFAULT 0 NOT NULL,
  notes text,
  terms text,
  payment_terms text,
  internal_notes text,
  tags ARRAY,
  template_name text,
  is_template boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  valid_until timestamp with time zone,
  public_token text,
  unique_token text,
  parent_quote_id uuid,
  version integer DEFAULT 1 NOT NULL,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  original_status text,
  organization_id uuid,
  download_count integer DEFAULT 0,
  sent_at timestamp with time zone
);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_parent_quote_id_fkey FOREIGN KEY (parent_quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_public_token_key UNIQUE (public_token);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_unique_token_key UNIQUE (unique_token);
ALTER TABLE ONLY public.quotes ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== rate_limits ==========
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  count integer DEFAULT 0 NOT NULL,
  first_seen timestamp with time zone NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.rate_limits ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (key);

-- ========== referrals ==========
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  referrer_id uuid,
  referred_id uuid,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  referred_email text
);
ALTER TABLE ONLY public.referrals ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.referrals ADD CONSTRAINT referrals_referred_email_unique UNIQUE (referred_email);
ALTER TABLE ONLY public.referrals ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.referrals ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id);

-- ========== subscriptions ==========
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  razorpay_subscription_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  plan_type text DEFAULT 'starter'::text NOT NULL,
  billing_cycle text DEFAULT 'monthly'::text,
  base_price numeric,
  discount_amount numeric DEFAULT 0,
  gst_amount numeric,
  total_amount numeric,
  amount numeric NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  coupon_code text,
  coupon_discount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  cancelled_at timestamp with time zone,
  refund_id text,
  last_error text,
  grace_period_end timestamp with time zone,
  failed_payment_retries integer DEFAULT 0 NOT NULL,
  last_payment_attempt timestamp with time zone
);
ALTER TABLE ONLY public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== team_members ==========
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_user_id uuid NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'member'::text NOT NULL,
  status text DEFAULT 'invited'::text NOT NULL,
  invited_at timestamp with time zone DEFAULT now() NOT NULL,
  joined_at timestamp with time zone,
  invite_token text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.team_members ADD CONSTRAINT team_members_account_user_id_fkey FOREIGN KEY (account_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.team_members ADD CONSTRAINT team_members_invite_token_key UNIQUE (invite_token);
ALTER TABLE ONLY public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);

-- ========== user_achievements ==========
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  achievement text NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
  metadata jsonb
);
ALTER TABLE ONLY public.user_achievements ADD CONSTRAINT user_achievements_achievement_fkey FOREIGN KEY (achievement) REFERENCES achievement_definitions(key);
ALTER TABLE ONLY public.user_achievements ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_achievements ADD CONSTRAINT user_achievements_user_id_achievement_key UNIQUE (user_id, achievement);
ALTER TABLE ONLY public.user_achievements ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== user_flag_overrides ==========
CREATE TABLE IF NOT EXISTS public.user_flag_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  flag_key text NOT NULL,
  enabled boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.user_flag_overrides ADD CONSTRAINT user_flag_overrides_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_flag_overrides ADD CONSTRAINT user_flag_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_flag_overrides ADD CONSTRAINT user_flag_overrides_user_id_flag_key_key UNIQUE (user_id, flag_key);

-- ========== voice_sessions ==========
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb NOT NULL,
  context jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.voice_sessions ADD CONSTRAINT voice_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.voice_sessions ADD CONSTRAINT voice_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========== webhook_events ==========
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  razorpay_event_id text NOT NULL,
  event_type text NOT NULL,
  user_id uuid,
  processed_at timestamp with time zone DEFAULT now() NOT NULL,
  payload jsonb,
  outcome text DEFAULT 'processed'::text,
  subscription_id uuid
);
ALTER TABLE ONLY public.webhook_events ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.webhook_events ADD CONSTRAINT webhook_events_razorpay_event_id_key UNIQUE (razorpay_event_id);
ALTER TABLE ONLY public.webhook_events ADD CONSTRAINT webhook_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

-- ========== webhooks ==========
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  url text NOT NULL,
  events ARRAY NOT NULL,
  secret text,
  active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.webhooks ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.webhooks ADD CONSTRAINT webhooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
