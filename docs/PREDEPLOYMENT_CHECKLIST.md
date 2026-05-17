# SendQuote — Predeployment Checklist

**Last updated:** 2026-05-17
**Product readiness score:** 87/100
**Tests:** 292 passing, 0 failed
**Migrations:** 000–029
**Theme:** Light only (dark mode deferred)

---

## 1. Environments & Configuration

### 1.1 Required Environment Variables

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only, **never expose to client**)

#### Razorpay
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Razorpay public key ID
- [ ] `RAZORPAY_KEY_SECRET` — Razorpay secret key (server-side only)

#### Email (SMTP primary + Resend fallback)
- [ ] `SMTP_HOST` — SMTP server (e.g., `smtp.gmail.com`)
- [ ] `SMTP_PORT` — SMTP port (e.g., `587`)
- [ ] `SMTP_USER` — SMTP username/email
- [ ] `SMTP_PASS` — SMTP password/app password
- [ ] `RESEND_API_KEY` — Resend API key (fallback, optional)
- [ ] `FROM_EMAIL` — Default sender email address

#### Sentry (optional)
- [ ] `SENTRY_DSN` — Sentry DSN (leave blank to disable)

#### App URLs
- [ ] `NEXT_PUBLIC_SITE_URL` — Production URL (e.g., `https://sendquote.com`)
- [ ] `NEXT_PUBLIC_ADMIN_SECRET` — Admin panel access secret

#### Cron
- [ ] `CRON_SECRET` — Secret for authenticating cron endpoint calls

### 1.2 Environment Setup

#### Local Development
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required variables (use test keys for Razorpay)
- [ ] Run `npm run dev` — verify no env validation errors on startup

#### Staging
- [ ] Set all env vars in Vercel/Netlify dashboard
- [ ] Use staging Supabase project
- [ ] Use Razorpay test keys
- [ ] Verify `/api/health` returns `{"status":"healthy"}`

#### Production
- [ ] Set all env vars in Vercel/Netlify dashboard
- [ ] Use production Supabase project
- [ ] Use Razorpay live keys
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Verify `/api/health` returns `{"status":"healthy"}`

### 1.3 Verify Environment Correctness
- [ ] `src/lib/env.ts` runs `env.init()` on server startup — fails fast on missing required vars
- [ ] `/api/health` endpoint returns healthy status with DB connectivity
- [ ] Admin dashboard loads without auth errors

---

## 2. Database & Migrations

### 2.1 Apply Migrations
- [ ] All migrations 000–029 are present in `supabase/migrations/`
- [ ] Apply migrations via Supabase CLI: `supabase db push`
- [ ] OR apply via Supabase Dashboard → SQL Editor (paste each migration in order)
- [ ] **Backup:** Take a Supabase backup before applying any new migration

### 2.2 Post-Migration Checks
- [ ] `/api/health` returns healthy
- [ ] Admin dashboard `/admin/dashboard` loads with stats
- [ ] Key tables exist: `profiles`, `quotes`, `quote_items`, `invoices`, `invoice_items`, `quote_events`, `activity_logs`, `cron_reminders`, `email_templates`, `voice_sessions`, `feedback`, `webhook_events`, `subscriptions`, `coupons`, `referrals`, `analytics_events`
- [ ] RLS policies active on all tables (check Supabase Dashboard → Authentication → Policies)
- [ ] Key RPCs exist: `create_quote_with_items`, `create_invoice_from_quote`, `next_quote_number`, `get_quote_admin`, `get_profile_admin`, `calc_invoice_balance`, `apply_coupon`, `check_team_limit`

### 2.3 Backup Strategy
- [ ] Supabase automated backups enabled (Dashboard → Settings → Database → Backups)
- [ ] Know how to restore: Supabase Dashboard → Backups → Restore
- [ ] For major schema changes: take manual backup before applying

---

## 3. Auth & Security

### 3.1 Supabase Auth Configuration
- [ ] Email verification enabled in Supabase Dashboard → Authentication → Providers → Email
- [ ] Password reset email template configured (or using Supabase default)
- [ ] Site URL in Supabase Auth settings matches `NEXT_PUBLIC_SITE_URL`
- [ ] Redirect URLs configured: `http://localhost:3000/**` (dev), production URL (prod)

### 3.2 RLS Policies
Verify policies are active on these tables:
- [ ] `profiles` — Users can view/update own profile
- [ ] `quotes` — Users can CRUD own quotes; admins can view all
- [ ] `quote_items` — Users can CRUD own quote items
- [ ] `invoices` — Users can CRUD own invoices
- [ ] `invoice_items` — Users can CRUD own invoice items
- [ ] `quote_events` — Users can view own events
- [ ] `activity_logs` — Users can view own logs
- [ ] `cron_reminders` — Users can view own reminders
- [ ] `email_templates` — Users can CRUD own templates
- [ ] `voice_sessions` — Users can CRUD own sessions
- [ ] `feedback` — Users can insert own feedback; admins can view all
- [ ] `webhook_events` — Server-side only (no user access needed)
- [ ] `subscriptions` — Users can view own subscriptions
- [ ] `coupons` — Server-side only (admin managed)
- [ ] `referrals` — Users can view own referrals
- [ ] `analytics_events` — Server-side only

### 3.3 CSRF & Webhook Security
- [ ] CSRF double-submit cookie pattern active on mutating API routes
- [ ] CSRF cookie set in middleware (`src/middleware.ts`)
- [ ] Razorpay webhook signature verification in `/api/webhooks/trigger`
- [ ] Webhook idempotency via `webhook_events` table (atomic INSERT gate)

---

## 4. Billing & Webhooks

### 4.1 Razorpay Setup
- [ ] Razorpay account created and verified
- [ ] Test keys configured for staging
- [ ] Live keys configured for production
- [ ] Webhook URL set in Razorpay Dashboard: `https://<your-domain>/api/webhooks/trigger`
- [ ] Webhook events subscribed: `payment.captured`, `payment.failed`, `subscription.activated`, `subscription.cancelled`, `subscription.halted`, `subscription.resumed`, `subscription.expired`, `refund.processed`

### 4.2 Verify Webhooks
- [ ] Send a test payment in Razorpay test mode
- [ ] Check `/api/webhooks/trigger` logs for successful processing
- [ ] Verify admin dashboard shows updated revenue/subscription stats
- [ ] Check `webhook_events` table for recorded events

### 4.3 Known Billing Limitations
- [ ] **No proration:** Mid-cycle plan changes take effect at next billing cycle (SQ-20 deferred)
- [ ] **Partial refunds:** Full refund only; partial refunds not implemented
- [ ] **Cancellation grace period:** Access retained until `current_period_end` on `subscription.cancelled`

---

## 5. Cron & Scheduled Tasks

### 5.1 Cron Endpoints
- [ ] `/api/cron` — Main cron handler for all scheduled tasks
- [ ] Protected by `CRON_SECRET` header verification

### 5.2 Scheduled Tasks
| Task | Frequency | Description |
|---|---|---|
| Follow-up reminders | Every 6 hours | Notify users when quotes unopened for 48h |
| After-open reminders | Every 6 hours | Notify users 24h after quote opened without response |
| Expiry warnings | Every 6 hours | Notify users when quotes expire tomorrow |
| Auto-expire quotes | Every 6 hours | Mark quotes past `valid_until` as expired |
| Invoice overdue reminders | Every 6 hours | Notify users of overdue invoices |
| Archive old events | Daily | Archive `quote_events` older than 90 days |
| Prune activity logs | Daily | Delete `activity_logs` older than 30 days |
| Clean admin sessions | Daily | Expire old admin sessions |
| Purge soft-deleted quotes | Daily | Hard-delete quotes soft-deleted > 30 days |
| Downgrade expired plans | Daily | Downgrade users whose plan expired |

### 5.3 Cron Configuration
- [ ] **Vercel Cron:** Add to `vercel.json`:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron",
        "schedule": "0 */6 * * *"
      }
    ]
  }
  ```
- [ ] **Alternative:** GitHub Actions, Supabase cron, or external scheduler (Cron-job.org)
- [ ] Set `CRON_SECRET` env var on the scheduler
- [ ] Verify cron runs by checking `cron_reminders` table and user email logs

---

## 6. Logging & Observability

### 6.1 Current Logging Setup
- [ ] Structured logging via `src/lib/logger.ts` (JSON format with requestId)
- [ ] Key flows use structured logging: quote creation, email sending, webhooks, cron, billing
- [ ] Error boundaries in place: `src/components/error-boundary.tsx`

### 6.2 Sentry Integration (Optional)
- [ ] `SENTRY_DSN` env var available (blank by default)
- [ ] To enable: Set `SENTRY_DSN` to your Sentry DSN
- [ ] Add Sentry SDK: `npm install @sentry/nextjs`
- [ ] Configure in `sentry.client.config.ts` and `sentry.server.config.ts`
- [ ] Replace `console.error` calls in critical paths with `Sentry.captureException()`
- [ ] Document: Sentry dashboard URL, team access, alerting rules

### 6.3 Manual Checks
- [ ] `/api/health` — Returns healthy status with DB connectivity
- [ ] Admin dashboard — Shows real-time stats, webhook events, user activity
- [ ] Server logs — Check for errors after deployment (Vercel logs, Supabase logs)
- [ ] Webhook failures — Check `webhook_events` table for `status = 'failed'`

---

## 7. Performance & Load Sanity

### 7.1 Database Indexes
| Table | Index | Purpose |
|---|---|---|
| `quotes` | `(user_id, status)` | Filter quotes by status |
| `quotes` | `(user_id, created_at DESC)` | Recent quotes query |
| `invoices` | `(user_id, status)` | Filter invoices by status |
| `invoices` | `(user_id, created_at DESC)` | Recent invoices query |
| `quote_events` | `(user_id, created_at DESC)` | Activity timeline |
| `quote_events` | `(entity_type, entity_id)` | Event lookup by entity |
| `voice_sessions` | `(user_id, updated_at DESC)` | Session lookup |
| `feedback` | `(user_id, created_at DESC)` | User feedback history |
| `feedback` | `(category)` | Filter by category |
| `feedback` | `(rating)` | Filter by rating |
| `feedback` | `(created_at DESC)` | Recent feedback |
| `cron_reminders` | `(quote_id, reminder_type)` UNIQUE | Prevent duplicate reminders |

### 7.2 Recommended Initial Scale
- [ ] **Target:** 10–50 active accounts
- [ ] **Monitor:** Dashboard load time, quote creation speed, email delivery latency
- [ ] **If slow:** Check Supabase query performance, add missing indexes, review N+1 queries

### 7.3 Manual Load Test Procedure
- [ ] Create 10 quotes in rapid succession
- [ ] Open 5 quotes from different browser tabs (simulate client opens)
- [ ] Accept 3 quotes, convert to invoices
- [ ] Record payments for 2 invoices
- [ ] Check dashboard loads within 2 seconds
- [ ] Check admin dashboard loads within 3 seconds

---

## 8. Testing & QA

### 8.1 Automated Tests
- [ ] Run `npm test` — 301 tests passing
- [ ] Tests cover: voice engine, voice commands, voice session, email templates, billing, webhooks, CSRF, auth, plan limits, rate limiting, validation, analytics, encryption, logger, PDF generation helpers

### 8.2 What's NOT Covered
- [ ] **No E2E tests** — Critical user journeys not automated
- [ ] **No API route tests** for all endpoints
- [ ] **No load tests** — No automated concurrent user simulation

### 8.3 Manual QA Scenarios
Run through each scenario before going live:

#### User Journey
- [ ] Signup with new email
- [ ] Verify email (check inbox, click link)
- [ ] Login with verified account
- [ ] Complete onboarding wizard
- [ ] Create quote manually (all 4 steps)
- [ ] Create quote via voice (beta-enabled)
- [ ] Save quote as draft
- [ ] Send quote via email
- [ ] Open quote from client link (incognito browser)
- [ ] Accept quote as client
- [ ] Convert accepted quote to invoice
- [ ] Record payment against invoice
- [ ] Check dashboard stats updated correctly

#### Admin Checks
- [ ] Login to admin dashboard
- [ ] Verify user count, quote count, revenue stats
- [ ] Check feedback tab shows test feedback
- [ ] Check coupons tab
- [ ] Check quotes tab shows actual quotes

#### Billing
- [ ] Upgrade from free to starter (Razorpay checkout)
- [ ] Verify webhook processes payment
- [ ] Verify plan changes in profile
- [ ] Cancel subscription
- [ ] Verify access retained until period end

#### Edge Cases
- [ ] Try to create 6th quote on free plan (should fail)
- [ ] Try to access another user's quote (should fail)
- [ ] Try to access admin without secret (should redirect)
- [ ] Send feedback from dashboard
- [ ] Check feedback appears in admin tab

---

## 9. Deployment Steps

### 9.1 Deploy Sequence
1. [ ] **Apply migrations:** `supabase db push` (or via Dashboard)
2. [ ] **Set env vars:** All variables from Section 1.1
3. [ ] **Deploy app:** `vercel deploy --prod` or push to main branch
4. [ ] **Verify build:** Check build logs for errors
5. [ ] **Check health:** Visit `/api/health` — expect `{"status":"healthy"}`
6. [ ] **Run smoke tests:** Execute manual QA scenarios from Section 8.3
7. [ ] **Verify cron:** Trigger `/api/cron` manually with `CRON_SECRET` header
8. [ ] **Verify webhooks:** Send test Razorpay event, check logs

### 9.2 Build Steps
- [ ] `npm run build` — Next.js production build
- [ ] `npm run lint` — ESLint check (0 errors)
- [ ] `npx tsc --noEmit` — TypeScript check (0 errors)
- [ ] `npm test` — All tests passing

### 9.3 CI/CD (if using GitHub + Vercel)
- [ ] GitHub Actions run lint + typecheck + tests on PR
- [ ] Vercel auto-deploys on push to main
- [ ] Preview deployments for PRs
- [ ] Production deployment requires main branch merge

---

## 10. Post-Deploy Monitoring

### 10.1 First 24–48 Hours
- [ ] **Errors:** Monitor server logs for unhandled exceptions
- [ ] **Webhooks:** Check `webhook_events` table for failed events
- [ ] **Cron:** Verify cron runs on schedule, check `cron_reminders` table
- [ ] **Billing:** Monitor Razorpay dashboard for failed payments
- [ ] **Email delivery:** Check SMTP/Resend delivery rates, bounce rates
- [ ] **User feedback:** Watch admin feedback tab for early user reports

### 10.2 Rollback Plan
- [ ] **App rollback:** Vercel → Deployments → Promote previous deployment
- [ ] **Database rollback:** Supabase → Backups → Restore (caution: data loss)
- [ ] **Env vars rollback:** Revert to previous env var values in Vercel dashboard
- [ ] **Migration rollback:** Supabase does not support migration rollback; restore from backup if needed

### 10.3 Alerting Setup (Recommended)
- [ ] Vercel deployment failure alerts (email/Slack)
- [ ] Supabase database alerts (disk space, connection limits)
- [ ] Razorpay webhook failure alerts (dashboard notifications)
- [ ] Sentry alerts (if enabled) for error rate spikes

---

## Quick Reference

| Item | Location |
|---|---|
| Health check | `/api/health` |
| Admin dashboard | `/admin/dashboard` |
| Cron endpoint | `/api/cron` |
| Webhook endpoint | `/api/webhooks/trigger` |
| Migrations | `supabase/migrations/` |
| Env validation | `src/lib/env.ts` |
| Logger | `src/lib/logger.ts` |
| Error boundary | `src/components/error-boundary.tsx` |
| CSRF config | `src/lib/csrf.ts`, `src/middleware.ts` |
| Test command | `npm test` |
| Build command | `npm run build` |
