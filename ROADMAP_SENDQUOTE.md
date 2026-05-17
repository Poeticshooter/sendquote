# SendQuote — Completion Roadmap

**Status:** Awaiting approval to begin execution
**Constraint:** No new paid APIs or paid third-party services

---

## Phase 1: Fix Critical Schema & Data Integrity (2-3 days)

**Objective:** Make all existing features actually work end-to-end.

### Tasks

1. **Add `invoice_items` table** — New migration mirroring `quote_items` structure
2. **Add missing `invoices` columns** — `client_address`, `client_phone`, `subtotal`, `discount`, `discount_type`, `gst_rate`, `gst_amount`, `paid_amount`, `terms`, `notes`, `payment_terms`, `balance_due`
3. **Add missing `quotes` columns** — `parent_quote_id`, `version`
4. **Create `webhooks` table** — For user-configurable outgoing webhooks
5. **Define all missing RPC functions** — `get_quote_admin`, `get_profile_admin`, `get_quote_items`, `record_quote_action`, `next_quote_number`, `apply_coupon`, `check_team_limit`, `cleanup_expired_admin_sessions`, `purge_soft_deleted_quotes`, `downgrade_expired_plans`, `create_invoice_from_quote`
6. **Fix cron `getEmail()`** — Query auth.users instead of profiles.user_id
7. **Consolidate `getUser`** — Single source in `src/lib/auth.ts`, remove 2 duplicates

### Affected Files
- `supabase/migrations/013_fix_invoice_schema.sql` (new)
- `supabase/migrations/014_add_webhooks_table.sql` (new)
- `supabase/migrations/015_add_missing_rpc_functions.sql` (new)
- `src/app/api/cron/route.ts`
- `src/app/api/create-razorpay-order/route.ts`
- `src/app/invoice/[id]/pdf/route.ts`
- `src/lib/auth.ts`

---

## Phase 2: Harden Security & Reliability (2-3 days)

**Objective:** Production-grade security posture.

### Tasks

1. **Auth on webhook trigger** — Require user auth on `/api/webhooks/trigger`
2. **Fix webhook CRUD auth** — Use `getUser()` instead of broken admin client auth
3. **Webhook idempotency** — Track processed Razorpay event IDs
4. **Switch email to SMTP** — Use nodemailer instead of Resend; keep Resend as optional fallback
5. **Zod input validation** — Add to all critical API routes
6. **CSRF protection** — SameSite cookies + CSRF tokens
7. **Structured logging** — Replace console.error with JSON logs
8. **Env var validation** — Fail fast on missing required vars

### Affected Files
- `src/app/api/webhooks/trigger/route.ts`
- `src/app/api/webhooks/route.ts`
- `src/app/api/webhook/route.ts`
- `src/lib/email.ts`
- `src/lib/logger.ts` (new)
- `src/lib/env.ts` (new)
- All API routes (validation)

---

## Phase 3: Complete Missing Core Features (3-4 days)

**Objective:** Fill gaps that block a production-ready SaaS.

### Tasks

1. **Invoice CRUD API** — REST API for listing, updating, deleting invoices
2. **Payment recording API** — Record manual/offline payments
3. **Complete team invite flow** — Accept invite → join team
4. **"Send Quote Email" UI button** — Trigger email from quote detail
5. **Invoice creation UI** — Convert quote to invoice with form
6. **Payment tracking UI** — Show paid amount, balance, history
7. **Activity timeline** — Show quote lifecycle events in detail view
8. **Change request email notifications** — Notify on client changes

### Affected Files
- `src/app/api/invoices/route.ts` (new)
- `src/app/api/payments/route.ts` (new)
- `src/app/api/team/route.ts`
- `src/app/quote/[id]/QuoteDetailClient.tsx`
- `src/app/invoices/InvoicesClient.tsx`
- `src/app/invoice/[id]/InvoiceDetailClient.tsx`
- `src/lib/email.ts`

---

## Phase 4: Production Readiness & Observability (2-3 days)

**Objective:** Ship-ready with monitoring, testing, and documentation.

### Tasks

1. **Test coverage thresholds** — 80%+ on lib/
2. **API route tests** — Cover uncovered routes
3. **E2E: quote create → send → accept** — Full user journey
4. **E2E: payment flow** — Upgrade + webhook
5. **Rewrite README** — Project-specific docs
6. **Clean up outdated docs** — Delete or update PROJECT_DOCUMENTATION.md
7. **Enhanced pre-deploy check** — Validate all env vars
8. **Health check with DB verification** — Check Supabase connectivity
9. **Refactor QuoteWizard** — Split into smaller components
10. **Refactor DashboardShell** — Extract sub-components

### Affected Files
- `vitest.config.ts`
- `src/**/*.test.ts` (new tests)
- `e2e/` (new tests)
- `README.md`
- `pre-deploy-check.sh`
- `src/app/api/health/route.ts`
- `src/components/quote-wizard.tsx` → split
- `src/app/dashboard/DashboardShell.tsx` → split

---

## Phase 5: Polish & Performance (1-2 days)

**Objective:** Great UX and fast load times.

### Tasks

1. **Loading/empty/error states** — All pages
2. **Optimize landing bundle** — Code-split animations
3. **CDN caching headers** — PDFs, logos
4. **Database indexes** — Composite indexes for common queries
5. **Keyboard shortcut hints** — UI discoverability
6. **Google Search Console** — Verification meta tag
7. **Remove dead code** — chat-bot, unused components

### Affected Files
- Various client components
- `next.config.ts`
- `src/components/landing/`
- `src/components/chat-bot.tsx` (delete)
- `src/app/layout.tsx`

---

## Cost Impact

| Before | After |
|--------|-------|
| Resend (email) — paid beyond free tier | Gmail SMTP via nodemailer — **free** |
| Sentry — free tier OK | Keep — free tier OK |
| Razorpay — transaction fees | Keep — unavoidable |
| Supabase — free tier OK | Keep — free tier OK |
| **Total: ~$0-20/mo** | **Total: $0/mo** (excl. Razorpay fees) |

---

## Approval

Reply with the phase number you want to execute first (e.g., "Start Phase 1").
