-- Migration 026: Email templates table
-- DB-backed email templates with variable substitution.
-- Users can customize quote/invoice email bodies.

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  template_key TEXT NOT NULL CHECK (template_key IN ('quote_send', 'quote_opened', 'quote_accepted', 'quote_changes_requested', 'quote_follow_up', 'quote_expiry', 'invoice_send', 'invoice_overdue', 'password_reset')),
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, template_key)
);

CREATE INDEX idx_email_templates_user ON email_templates(user_id);
CREATE INDEX idx_email_templates_key ON email_templates(template_key);

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email templates"
  ON email_templates FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Seed default templates for all existing users
INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_send',
  'Quote {{quote_number}} from {{business_name}}',
  '<p>Dear <strong>{{client_name}}</strong>,</p>
   <p>Please find your quote from <strong>{{business_name}}</strong> below.</p>
   {{items_table}}
   {{totals_table}}
   {{notes_section}}
   <p><a href="{{quote_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Quote Online</a></p>
   <p>If you have any questions, please feel free to reach out.</p>
   <p>Thanks,<br/><strong>{{business_name}}</strong></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_send'
);

INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_opened',
  'Quote #{{quote_number}} opened by {{client_name}}',
  '<p><strong>{{client_name}}</strong> has opened your quote <strong>#{{quote_number}}</strong>.</p>
   <p>This is the perfect time to follow up — call them now!</p>
   <p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_opened'
);

INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_accepted',
  'Quote #{{quote_number}} accepted by {{client_name}}',
  '<p>Congratulations! <strong>{{client_name}}</strong> has accepted your quote <strong>#{{quote_number}}</strong>.</p>
   <p>The quote is now marked as accepted. You can proceed with the next steps.</p>
   <p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_accepted'
);

INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_changes_requested',
  'Changes requested on quote #{{quote_number}}',
  '<p><strong>{{client_name}}</strong> requested changes on quote <strong>#{{quote_number}}</strong>.</p>
   <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;">
   <p style="background-color:#f8fafc; padding:16px; border-radius:8px;">{{message}}</p>
   <p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Quote</a></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_changes_requested'
);

INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_follow_up',
  'Follow up: {{client_name}} hasn''t opened your quote',
  '<p>Your quote <strong>#{{quote_number}}</strong> to <strong>{{client_name}}</strong> has not been opened yet (48+ hours).</p>
   <p>Consider sending a follow-up message or calling them directly.</p>
   <p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_follow_up'
);

INSERT INTO email_templates (user_id, template_key, subject, body_html)
SELECT
  user_id,
  'quote_expiry',
  'Quote #{{quote_number}} to {{client_name}} expires tomorrow',
  '<p>Your quote <strong>#{{quote_number}}</strong> to <strong>{{client_name}}</strong> expires tomorrow.</p>
   <p>Follow up before it expires!</p>
   <p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates et WHERE et.user_id = profiles.user_id AND et.template_key = 'quote_expiry'
);

-- Trigger to auto-create templates for new users
CREATE OR REPLACE FUNCTION seed_email_templates_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_templates (user_id, template_key, subject, body_html) VALUES
    (NEW.user_id, 'quote_send', 'Quote {{quote_number}} from {{business_name}}', '<p>Dear <strong>{{client_name}}</strong>,</p><p>Please find your quote from <strong>{{business_name}}</strong> below.</p>{{items_table}}{{totals_table}}{{notes_section}}<p><a href="{{quote_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Quote Online</a></p><p>Thanks,<br/><strong>{{business_name}}</strong></p>'),
    (NEW.user_id, 'quote_opened', 'Quote #{{quote_number}} opened by {{client_name}}', '<p><strong>{{client_name}}</strong> has opened your quote <strong>#{{quote_number}}</strong>.</p><p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'),
    (NEW.user_id, 'quote_accepted', 'Quote #{{quote_number}} accepted by {{client_name}}', '<p>Congratulations! <strong>{{client_name}}</strong> has accepted your quote <strong>#{{quote_number}}</strong>.</p><p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'),
    (NEW.user_id, 'quote_changes_requested', 'Changes requested on quote #{{quote_number}}', '<p><strong>{{client_name}}</strong> requested changes on quote <strong>#{{quote_number}}</strong>.</p><p style="background-color:#f8fafc; padding:16px; border-radius:8px;">{{message}}</p><p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Quote</a></p>'),
    (NEW.user_id, 'quote_follow_up', 'Follow up: {{client_name}} hasn''t opened your quote', '<p>Your quote <strong>#{{quote_number}}</strong> to <strong>{{client_name}}</strong> has not been opened yet.</p><p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>'),
    (NEW.user_id, 'quote_expiry', 'Quote #{{quote_number}} to {{client_name}} expires tomorrow', '<p>Your quote <strong>#{{quote_number}}</strong> to <strong>{{client_name}}</strong> expires tomorrow.</p><p><a href="{{dashboard_link}}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600;">View Dashboard</a></p>')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_seed_email_templates ON profiles;
CREATE TRIGGER trigger_seed_email_templates
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION seed_email_templates_for_new_user();
