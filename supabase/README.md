# SendQuote Supabase Configuration

## Project
- URL: https://yabsujbilznpoayueokq.supabase.co
- CLI: `supabase link --project-ref yabsujbilznpoayueokq`

## Schemas
All tables are in the `public` schema. RLS is enabled on all data tables.

### Quotes
- `quotes` — Core quote records with status workflow (draft → sent → accepted/rejected)
- `quote_items` — Line items per quote
- `quote_events` — Buyer event tracking (views, clicks, duration)
- `quote_signatures` — E-signature records

### Billing
- `invoices` — Auto-generated from accepted quotes
- `invoice_items` — Invoice line items
- `payments` — Payment tracking (Razorpay)
- `subscriptions` — Razorpay subscription management

### CRM
- `clients` — Client records (auto-saved from quotes)
- `leads` — Landing page lead capture

### Workflow
- `approval_rules` — Discount/approval threshold rules
- `approval_requests` — Pending approval requests
- `deal_room_messages` — In-quote chat messages
- `cron_reminders` — Scheduled follow-up emails
- `email_templates` — Follow-up email sequence templates

### Auth & Organizations
- `profiles` — Extended user profiles (business name, GST, quote counter)
- `organizations` — Multi-tenant organizations
- `organization_members` — Org membership
- `team_members` — Team invitations

### Gamification
- `achievements` — Achievement definitions
- `user_achievements` — User achievement progress
- `health_scores` — Account health score snapshots
- `referrals` — Referral tracking (unique on referrer_id + referred_email)

### System
- `feature_flags` — Feature toggles
- `analytics_events` — Product analytics
- `activity_logs` — Audit trail
- `webhook_events` — Incoming webhooks (Razorpay, n8n)
- `rate_limits` — Rate limiting (IP-based)
- `error_logs` — Error capture
- `feedback` — User feedback
- `voice_sessions` — Voice assistant sessions

## RPC Functions
- `increment_quote_counter(p_user_id UUID)` — Atomically increments `profiles.quote_counter` and returns new value. Used by `generateQuoteNumber()` to prevent duplicate quote numbers.

## Migrations
```
supabase/migrations/
├── README.md
└── 20260608_fixes_migrations.sql   # RPC function + referrals unique index
```

Run migrations:
```bash
supabase db push
```

## Key Policies
- All user data tables have RLS: `user_id = auth.uid()`
- Public quote view (`q/[token]`) uses `public_token` lookup, not auth
- Rate limits table has no RLS (inserted by middleware before auth)
- Webhook events table has no RLS (inserted by unauthenticated webhook handlers)
