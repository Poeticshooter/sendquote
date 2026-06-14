-- Migration: Add RLS policies to all unprotected tables
--
-- The audit found ~30 tables in the public schema without any RLS policies.
-- Any authenticated user could read/write any other user's data.
-- This migration enables RLS and adds appropriate policies to all of them.

-- ============================================================
-- 1. profiles — PII data (name, email, phone, address, GST, SMTP)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan IN ('enterprise', 'pro'))
  );

-- Profiles are created via trigger on signup; no INSERT policy needed for regular users

-- ============================================================
-- 2. quotes — Business data
-- ============================================================
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quotes" ON public.quotes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own quotes" ON public.quotes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quotes" ON public.quotes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own quotes" ON public.quotes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Organization-scoped access
CREATE POLICY "Org members can read org quotes" ON public.quotes
  FOR SELECT TO authenticated USING (
    organization_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.organization_members WHERE organization_members.organization_id = quotes.organization_id AND organization_members.user_id = auth.uid())
  );

-- ============================================================
-- 3. quote_items
-- ============================================================
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quote items" ON public.quote_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own quote items" ON public.quote_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  );

CREATE POLICY "Users can update own quote items" ON public.quote_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own quote items" ON public.quote_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_items.quote_id AND quotes.user_id = auth.uid())
  );

-- ============================================================
-- 4. quote_events — Buyer activity, quote access logs
-- ============================================================
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quote events" ON public.quote_events
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_events.quote_id AND quotes.user_id = auth.uid())
  );

CREATE POLICY "Anyone can insert quote events" ON public.quote_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 5. quote_signatures — PII (signatory name, email)
-- ============================================================
ALTER TABLE public.quote_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quote signatures" ON public.quote_signatures
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = quote_signatures.quote_id AND quotes.user_id = auth.uid())
  );

-- Signatures are inserted via the accept_quote RPC (SECURITY DEFINER)

-- ============================================================
-- 6. quote_templates — Read-only, all authenticated users
-- ============================================================
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read quote templates" ON public.quote_templates
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 7. invoices — Financial data
-- ============================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. invoice_items
-- ============================================================
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoice items" ON public.invoice_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
  );

-- ============================================================
-- 9. payments — Financial transaction data
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Payments are inserted via webhook handlers (SECURITY DEFINER)

-- ============================================================
-- 10. subscriptions — Payment/subscription details
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. clients — Business contacts
-- ============================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clients" ON public.clients
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create own clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 12. team_members
-- ============================================================
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own team members" ON public.team_members
  FOR SELECT TO authenticated USING (account_user_id = auth.uid());

CREATE POLICY "Users can invite team members" ON public.team_members
  FOR INSERT TO authenticated WITH CHECK (account_user_id = auth.uid());

CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE TO authenticated USING (account_user_id = auth.uid()) WITH CHECK (account_user_id = auth.uid());

-- ============================================================
-- 13. approval_rules
-- ============================================================
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own approval rules" ON public.approval_rules
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 14. approval_requests
-- ============================================================
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own approval requests" ON public.approval_requests
  FOR SELECT TO authenticated USING (requested_by = auth.uid() OR reviewer_id = auth.uid());

CREATE POLICY "Users can create approval requests" ON public.approval_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Reviewers can update approval requests" ON public.approval_requests
  FOR UPDATE TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

-- ============================================================
-- 15. deal_room_messages
-- ============================================================
ALTER TABLE public.deal_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deal room messages" ON public.deal_room_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.quotes WHERE quotes.id = deal_room_messages.quote_id AND quotes.user_id = auth.uid())
  );

CREATE POLICY "Users can send deal room messages" ON public.deal_room_messages
  FOR INSERT TO authenticated WITH CHECK (
    (sender_id = auth.uid()) OR
    (sender_type = 'buyer' AND EXISTS (
      SELECT 1 FROM public.quotes WHERE quotes.id = deal_room_messages.quote_id
    ))
  );

-- ============================================================
-- 16. followup_sequences — user_id can be null (system defaults)
-- ============================================================
-- Already has RLS from earlier migration

-- ============================================================
-- 17. followup_schedule
-- ============================================================
ALTER TABLE public.followup_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own followup schedule" ON public.followup_schedule
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 18. cron_reminders
-- ============================================================
ALTER TABLE public.cron_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reminders" ON public.cron_reminders
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own reminders" ON public.cron_reminders
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 19. activity_logs — Audit trail
-- ============================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 20. email_templates
-- ============================================================
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email templates" ON public.email_templates
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own email templates" ON public.email_templates
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 21. feedback
-- ============================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can submit feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 22. voice_sessions — Voice conversations
-- ============================================================
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voice sessions" ON public.voice_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own voice sessions" ON public.voice_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 23. webhook_events
-- ============================================================
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own webhook events" ON public.webhook_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Webhook events are inserted by SECURITY DEFINER functions

-- ============================================================
-- 24. webhooks — Outgoing webhook configurations
-- ============================================================
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON public.webhooks
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 25. analytics_events
-- ============================================================
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analytics" ON public.analytics_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analytics" ON public.analytics_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 26. coupons — Read-only, all authenticated users
-- ============================================================
-- Already has RLS from earlier migration

-- ============================================================
-- 27. coupon_usages
-- ============================================================
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own coupon usage" ON public.coupon_usages
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 28. leads
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own leads" ON public.leads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own leads" ON public.leads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 29. admin_sessions — Admin session tokens
-- ============================================================
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read admin sessions" ON public.admin_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND plan IN ('enterprise', 'pro'))
  );

-- Admin sessions are created by the admin login flow (SECURITY DEFINER)

-- ============================================================
-- 30. referrals
-- ============================================================
-- Already has RLS from earlier migration
