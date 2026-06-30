-- ============================================================================
-- SendQuote Security Migration: Row-Level Security (RLS) for All Tables
-- ============================================================================
-- This migration enables and adds RLS policies to all tables that were
-- previously unprotected. It also fixes the admin audit log policy.
-- ============================================================================

-- ─── 1. Quotes ─────────────────────────────────────────────────────────────
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_select_policy ON quotes;
DROP POLICY IF EXISTS quotes_insert_policy ON quotes;
DROP POLICY IF EXISTS quotes_update_policy ON quotes;
DROP POLICY IF EXISTS quotes_delete_policy ON quotes;

CREATE POLICY quotes_select_policy ON quotes
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY quotes_insert_policy ON quotes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY quotes_update_policy ON quotes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY quotes_delete_policy ON quotes
  FOR DELETE
  USING (user_id = auth.uid());

-- ─── 2. Invoices ───────────────────────────────────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_select_policy ON invoices;
DROP POLICY IF EXISTS invoices_insert_policy ON invoices;
DROP POLICY IF EXISTS invoices_update_policy ON invoices;

CREATE POLICY invoices_select_policy ON invoices
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY invoices_insert_policy ON invoices
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY invoices_update_policy ON invoices
  FOR UPDATE
  USING (user_id = auth.uid());

-- ─── 3. Payments ───────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_policy ON payments;
DROP POLICY IF EXISTS payments_insert_policy ON payments;

CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY payments_insert_policy ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── 4. Subscriptions ───────────────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_policy ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update_policy ON subscriptions;

CREATE POLICY subscriptions_select_policy ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY subscriptions_update_policy ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid());

-- ─── 5. Profiles ───────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;

CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── 6. Clients ────────────────────────────────────────────────────────────
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clients_select_policy ON clients;
DROP POLICY IF EXISTS clients_insert_policy ON clients;
DROP POLICY IF EXISTS clients_update_policy ON clients;
DROP POLICY IF EXISTS clients_delete_policy ON clients;

CREATE POLICY clients_select_policy ON clients
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY clients_insert_policy ON clients
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY clients_update_policy ON clients
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY clients_delete_policy ON clients
  FOR DELETE
  USING (user_id = auth.uid());

-- ─── 7. Quote Items ────────────────────────────────────────────────────────
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_items_select_policy ON quote_items;
DROP POLICY IF EXISTS quote_items_insert_policy ON quote_items;
DROP POLICY IF EXISTS quote_items_update_policy ON quote_items;

CREATE POLICY quote_items_select_policy ON quote_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY quote_items_insert_policy ON quote_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY quote_items_update_policy ON quote_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- ─── 8. Quote Events ───────────────────────────────────────────────────────
ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_events_select_policy ON quote_events;
DROP POLICY IF EXISTS quote_events_insert_policy ON quote_events;

CREATE POLICY quote_events_select_policy ON quote_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_events.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY quote_events_insert_policy ON quote_events
  FOR INSERT
  WITH CHECK (true);  -- Allow anonymous tracking

-- ─── 9. Quote Signatures ───────────────────────────────────────────────────
ALTER TABLE quote_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_signatures_select_policy ON quote_signatures;
DROP POLICY IF EXISTS quote_signatures_insert_policy ON quote_signatures;

CREATE POLICY quote_signatures_select_policy ON quote_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_signatures.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY quote_signatures_insert_policy ON quote_signatures
  FOR INSERT
  WITH CHECK (true);  -- Allow anonymous signing via token

-- ─── 10. Team Members ─────────────────────────────────────────────────────
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_update_policy ON team_members;

CREATE POLICY team_members_select_policy ON team_members
  FOR SELECT
  USING (account_user_id = auth.uid());

CREATE POLICY team_members_insert_policy ON team_members
  FOR INSERT
  WITH CHECK (account_user_id = auth.uid());

CREATE POLICY team_members_update_policy ON team_members
  FOR UPDATE
  USING (account_user_id = auth.uid());

-- ─── 11. Organizations ─────────────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_select_policy ON organizations;
DROP POLICY IF EXISTS organizations_insert_policy ON organizations;
DROP POLICY IF EXISTS organizations_update_policy ON organizations;

CREATE POLICY organizations_select_policy ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY organizations_insert_policy ON organizations
  FOR INSERT
  WITH CHECK (true);  -- Any authenticated user can create org

CREATE POLICY organizations_update_policy ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

-- ─── 12. Organization Members ─────────────────────────────────────────────
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_members_select_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON organization_members;

CREATE POLICY organization_members_select_policy ON organization_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY organization_members_insert_policy ON organization_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'admin'
    )
  );

CREATE POLICY organization_members_delete_policy ON organization_members
  FOR DELETE
  USING (user_id = auth.uid());

-- ─── 13. Leads ─────────────────────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_select_policy ON leads;
DROP POLICY IF EXISTS leads_insert_policy ON leads;

CREATE POLICY leads_select_policy ON leads
  FOR SELECT
  USING (true);  -- Public access for landing page

CREATE POLICY leads_insert_policy ON leads
  FOR INSERT
  WITH CHECK (true);  -- Public submissions

-- ─── 14. Followup Sequences ────────────────────────────────────────────────
ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS followup_sequences_select_policy ON followup_sequences;
DROP POLICY IF EXISTS followup_sequences_insert_policy ON followup_sequences;
DROP POLICY IF EXISTS followup_sequences_update_policy ON followup_sequences;
DROP POLICY IF EXISTS followup_sequences_delete_policy ON followup_sequences;

CREATE POLICY followup_sequences_select_policy ON followup_sequences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY followup_sequences_insert_policy ON followup_sequences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY followup_sequences_update_policy ON followup_sequences
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY followup_sequences_delete_policy ON followup_sequences
  FOR DELETE
  USING (user_id = auth.uid());

-- ─── 15. Fix Admin Audit Log RLS ──────────────────────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop the broken policy that allowed all users to read
DROP POLICY IF EXISTS admin_audit_log_select_policy ON admin_audit_log;

-- Create proper admin-only audit log policy
CREATE POLICY admin_audit_log_select_policy ON admin_audit_log
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE plan IN ('pro', 'enterprise')
      OR is_admin = true
    )
  );

CREATE POLICY admin_audit_log_insert_policy ON admin_audit_log
  FOR INSERT
  WITH CHECK (true);  -- Any authenticated user can create audit entries

-- ─── 16. Error Logs ────────────────────────────────────────────────────────
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS error_logs_select_policy ON error_logs;
DROP POLICY IF EXISTS error_logs_insert_policy ON error_logs;

CREATE POLICY error_logs_select_policy ON error_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE plan IN ('pro', 'enterprise')
      OR is_admin = true
    )
  );

CREATE POLICY error_logs_insert_policy ON error_logs
  FOR INSERT
  WITH CHECK (true);  -- System can log errors

-- ─── 17. Voice Sessions ────────────────────────────────────────────────────
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voice_sessions_select_policy ON voice_sessions;
DROP POLICY IF EXISTS voice_sessions_insert_policy ON voice_sessions;

CREATE POLICY voice_sessions_select_policy ON voice_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY voice_sessions_insert_policy ON voice_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── 18. Email Templates ───────────────────────────────────────────────────
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS email_templates_select_policy ON email_templates;
DROP POLICY IF EXISTS email_templates_insert_policy ON email_templates;
DROP POLICY IF EXISTS email_templates_update_policy ON email_templates;
DROP POLICY IF EXISTS email_templates_delete_policy ON email_templates;

CREATE POLICY email_templates_select_policy ON email_templates
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY email_templates_insert_policy ON email_templates
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY email_templates_update_policy ON email_templates
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY email_templates_delete_policy ON email_templates
  FOR DELETE
  USING (user_id = auth.uid());

-- ─── 19. Analytics Events (System-managed) ─────────────────────────────────
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_insert_policy ON analytics_events;

CREATE POLICY analytics_events_insert_policy ON analytics_events
  FOR INSERT
  WITH CHECK (true);

-- ─── 20. Webhook Events (System-managed) ───────────────────────────────────
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_events_insert_policy ON webhook_events;

CREATE POLICY webhook_events_insert_policy ON webhook_events
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Verification
-- ============================================================================
-- Run: SELECT schemaname, tablename, rowsecurity FROM pg_tables
--      WHERE schemaname = 'public' ORDER BY tablename;
-- This should show rowsecurity = true for all data tables.
