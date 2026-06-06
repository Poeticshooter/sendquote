# SendQuote Supabase Configuration

## Project
- URL: https://yabsujbilznpoayueokq.supabase.co
- CLI: `supabase link --project-ref yabsujbilznpoayueokq`

## Schemas
All tables are in the `public` schema. Key tables:

### Quotes
- `quotes` — Core quote records with status workflow
- `quote_items` — Line items per quote
- `quote_events` — Buyer event tracking

### Billing
- `invoices` — Auto-generated from accepted quotes
- `invoice_items` — Invoice line items
- `payments` — Payment tracking
- `subscriptions` — Razorpay subscription management

### CRM
- `clients` — Client records
- `leads` — Landing page leads

### Workflow
- `approval_rules` — Discount/approval threshold rules
- `approval_requests` — Pending approval requests
- `deal_room_messages` — In-quote chat messages
- `cron_reminders` — Scheduled follow-ups

### Auth
- `profiles` — Extended user profiles
- `organizations` — Multi-tenant organizations
- `organization_members` — Org membership
- `team_members` — Team invitations

### System
- `feature_flags` — Feature toggles
- `analytics_events` — Product analytics
- `activity_logs` — Audit trail
- `webhook_events` — Incoming webhooks
- `rate_limits` — Rate limiting
- `error_logs` — Error capture
- `feedback` — User feedback
