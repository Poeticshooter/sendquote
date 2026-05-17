# SendQuote — Comprehensive Architecture Audit & Completion Roadmap

**Date:** 2026-05-17
**Auditor:** AI Engineer (deep codebase analysis, all source files read)
**Scope:** Full codebase review — src/, supabase/, config, API routes, middleware, auth, email, PDF, cron, webhooks, billing, tests
**Constraint:** No new paid APIs or paid third-party services. Prefer free tiers, open-source, self-hosted.

---

## 1. What the App Does Today

SendQuote is a B2B SaaS for small businesses (primarily in India) to create, send, track, and manage quotes and invoices. The core flow:

1. **User signs up** → Supabase Auth (email/password) → auto-creates profile (free plan)
2. **Creates a quote** → 4-step wizard (client details → line items → pricing → review) → saved to DB
3. **Sends quote** → email with PDF attachment + public share link (`/q/[token]`)
4. **Client views quote** → can accept, request changes, or pay via UPI deep link
5. **Tracking** → pixel tracking records when quote is opened; status auto-updates
6. **Convert to invoice** → accepted quotes become invoices with payment tracking
7. **Upgrade** → Razorpay checkout for Starter (₹299/mo) or Professional (₹799/mo) plans
8. **Cron jobs** → automated follow-up reminders, expiry warnings, data cleanup
9. **Admin panel** → separate auth (env credentials) for platform-level stats

### Key Features Implemented
- Quote CRUD with multi-step wizard, drag-and-drop reordering, voice input
- Public quote share pages with accept/changes/UPI pay actions
- PDF generation (quotes + invoices) via pdf-lib
- Email sending via Resend (with HTML templates)
- Razorpay payment integration (one-time + subscriptions)
- Coupon/discount system
- Team member invites (basic)
- Client management (dedicated table + API)
- Dashboard with search, filter, sort, pagination, bulk operations, real-time updates
- Data export (CSV, JSON, ZIP)
- Quote duplication
- Activity logging and analytics events
- Rate limiting (Supabase RPC + in-memory fallback)
- Sentry error monitoring
- i18n (English, Hindi)
- Landing page with animations
- Admin panel (separate from user auth)
- Webhook system (user-configurable outgoing webhooks)
- Voice quote creation (Web Speech API)

---

## 2. Current Architecture & Key Modules

### Frontend (Next.js 16 App Router)
| Route | Purpose | Type |
|-------|---------|------|
| `/` | Landing page | Client (split into components) |
| `/login`, `/register` | Auth forms | Client |
| `/forgot-password`, `/reset-password` | Password recovery | Client |
| `/dashboard` | Main dashboard | Server + Client shell |
| `/quote/new` | Create quote wizard | Client |
| `/quote/[id]` | Quote detail view | Server + Client |
| `/quote/[id]/edit` | Edit quote | Client (reuses wizard) |
| `/quote/voice` | Voice-created quote | Client |
| `/q/[token]` | Public quote share | Client |
| `/invoices` | Invoice list | Client |
| `/invoice/[id]` | Invoice detail | Client |
| `/invoice/[id]/pdf` | Invoice PDF download | API route |
| `/clients` | Client management | Client |
| `/settings` | User profile/business config | Client |
| `/templates` | Quote template gallery | Client |
| `/upgrade` | Pricing + Razorpay checkout | Client |
| `/admin/*` | Admin panel (separate auth) | Client + API |

### API Routes (17 route groups)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/coupons` | GET/POST/PATCH/DELETE | Coupon CRUD |
| `/api/admin/stats` | GET | Admin dashboard stats |
| `/api/clients` | GET/POST/PATCH/DELETE | Client CRUD |
| `/api/convert-to-invoice` | POST | Quote → Invoice conversion |
| `/api/create-razorpay-order` | POST/PUT | Payment order creation + verification |
| `/api/cron` | GET | Scheduled job handler |
| `/api/duplicate-quote` | POST | Clone a quote |
| `/api/export-all` | GET | Full data export (CSV/JSON/ZIP) |
| `/api/health` | GET | Health check |
| `/api/invoice-pdf/[id]` | GET | Invoice PDF generation |
| `/api/public-quote` | GET | Public quote data fetch |
| `/api/public-quote-action` | POST | Accept/changes on public quote |
| `/api/quote-pdf/[id]` | GET | Quote PDF generation |
| `/api/send-quote-email` | POST | Email quote to client |
| `/api/team` | GET/POST/PATCH/DELETE | Team member management |
| `/api/track` | GET | Pixel tracking (1x1 GIF) |
| `/api/upload-logo` | POST | Logo upload to Supabase storage |
| `/api/validate-coupon` | POST | Coupon validation |
| `/api/webhook` | POST | Razorpay incoming webhook |
| `/api/webhooks` | GET/POST/DELETE | User outgoing webhook CRUD |
| `/api/webhooks/trigger` | POST | Fire outgoing webhooks |

### Database (Supabase PostgreSQL)
**Tables defined in schema.sql + migrations:**
- `profiles` — user business data, plan, quota, settings
- `quotes` — quote records (soft-delete, public tokens, versioning)
- `quote_items` — line items (normalized table)
- `invoices` — invoice records
- `invoice_items` — invoice line items (referenced in code, NOT in schema.sql)
- `payments` — payment records (migration exists, NOT in schema.sql)
- `subscriptions` — Razorpay subscription tracking
- `track_events` — quote tracking events
- `quote_events` — detailed quote lifecycle events
- `activity_logs` — user activity audit trail
- `admin_sessions` — admin panel auth tokens
- `referrals` — referral tracking
- `rate_limits` — API rate limiting
- `coupons` + `coupon_usages` — discount system
- `cron_reminders` — cron job dedup tracking
- `clients` — dedicated client management
- `team_members` — team collaboration

**Storage:** `logos` (public), `pdfs` (private)

**RPC Functions:** `create_quote_with_items`, `soft_delete_quote`, `deduplicate_track_events`, `check_rate_limit`, `validate_coupon`, `increment_coupon_usage`, `check_subscription_expiry`, `increment_monthly_quote_count`, `handle_new_user` (trigger), `update_updated_at` (trigger)

### Auth Flow
1. User signs up via Supabase Auth → `handle_new_user` trigger creates profile
2. Middleware checks Supabase session cookie → redirects to `/login` if unauthenticated
3. API routes use `getUser()` from `src/lib/auth.ts` (checks Bearer token + cookies)
4. Admin panel uses separate env-based credentials with session tokens in `admin_sessions` table

### Email Flow
- Primary: Resend API (`resend` package)
- Email templates: HTML with SendQuote branding
- Notifications: quote opened, accepted, changes requested, follow-up reminders, expiry warnings
- **Issue:** `public-quote-action` passes SMTP credentials to `sendEmail()`, but `sendEmail()` only uses Resend — SMTP config is ignored

### Cron Flow
- Triggered via Vercel Cron or manual HTTP call with `CRON_SECRET`
- Jobs: follow-up reminders, after-open reminders, expiry warnings, auto-expire quotes, overdue invoice reminders, archive old events, prune logs, clean admin sessions, purge soft-deleted quotes, downgrade expired plans

---

## 3. Current Paid Service Dependencies

| Service | Usage | Free Tier Available? | Can Replace? |
|---------|-------|---------------------|--------------|
| **Resend** | Email sending | Yes (3,000 emails/mo free) | Yes — use Gmail SMTP (nodemailer) already in deps |
| **Sentry** | Error monitoring | Yes (5,000 errors/mo free) | No replacement needed; free tier sufficient |
| **Razorpay** | Payment processing | Yes (pay-per-transaction, no monthly fee) | No — essential for payments; unavoidable transaction fees |
| **Supabase** | Database + Auth + Storage | Yes (generous free tier) | No — core infrastructure; free tier sufficient for early stage |
| **Vercel** | Hosting (implied by .vercel/) | Yes (hobby tier) | Can self-host on Docker/Railway if needed |

**Recommendation:** Switch email from Resend to Gmail SMTP (nodemailer is already a dependency, SMTP env vars already defined). This removes the only optional paid API dependency.

---

## 4. Issues Found (Current State)

### CRITICAL — Blocks Production

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| C1 | **`invoice_items` table missing from schema** — Referenced in `/api/invoice-pdf/[id]/route.ts`, `/invoice/[id]/pdf/route.ts`, and export-all, but NOT defined in schema.sql or any migration | schema.sql, invoice-pdf routes, export-all | Invoice PDF generation crashes; invoices can't store line items |
| C2 | **`invoices` table missing critical columns** — Code references `client_address`, `client_phone`, `subtotal`, `discount`, `discount_type`, `gst_rate`, `gst_amount`, `paid_amount`, `terms`, `notes`, `payment_terms` but schema only has `id, user_id, quote_id, invoice_number, client_name, client_email, amount, status, due_date, created_at, updated_at` | schema.sql vs invoice PDF routes | Invoice PDF generation fails with undefined columns |
| C3 | **Duplicate `getUser` function in 3 places** — `src/lib/auth.ts`, `src/app/api/create-razorpay-order/route.ts:6-26`, `src/app/invoice/[id]/pdf/route.ts:6-26` — each is slightly different, maintenance nightmare | auth.ts, create-razorpay-order/route.ts, invoice-pdf route.ts | Code duplication, potential auth bypass if implementations diverge |
| C4 | **Unauthenticated webhook trigger** — `/api/webhooks/trigger` has NO auth check; anyone can POST to fire webhooks for any user | webhooks/trigger/route.ts | Security vulnerability: arbitrary webhook firing |
| C5 | **SMTP credentials stored in DB but never used** — `profiles.smtp_email` and `profiles.smtp_app_password` columns exist but `sendEmail()` in email.ts ignores them and only uses Resend | email.ts, profiles table | Users can't use their own SMTP; locked into Resend |
| C6 | **Cron `getEmail()` queries wrong column** — Fetches `user_id` from profiles instead of email from auth.users | cron/route.ts:58-67 | Cron email notifications never send (email is always null) |

### HIGH — Major Functionality or Security Gaps

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| H1 | **`/api/webhooks` route uses `createAdminClient().auth.getUser()` without auth header** — The GET/POST/DELETE handlers call `supabase.auth.getUser()` on an admin client, which doesn't parse cookies. Always returns null → 401 for all requests | webhooks/route.ts:58-61, 116-119, 130-133 | User webhook management completely broken |
| H2 | **Invoice creation lacks line item storage** — `convert-to-invoice` RPC creates invoice but doesn't copy quote_items to invoice_items | convert-to-invoice/route.ts, missing RPC | Invoices have no line items |
| H3 | **No input validation on API routes** — No Zod/schema validation on any API route; relies on `sanitizeInput` only | All API routes | Malformed data can reach DB; no structured error responses |
| H4 | **Webhook idempotency missing** — Razorpay webhook handler (`/api/webhook`) doesn't check for duplicate event delivery | webhook/route.ts | Double-charging or duplicate state updates on webhook retries |
| H5 | **`parent_quote_id` and `version` columns missing** — Duplicate quote route references these columns but they're not in schema | duplicate-quote/route.ts:58-59, schema.sql | Quote duplication fails |
| H6 | **Missing RPC functions** — Code calls `get_quote_admin`, `get_profile_admin`, `get_quote_items`, `record_quote_action`, `next_quote_number`, `apply_coupon`, `check_team_limit`, `cleanup_expired_admin_sessions`, `purge_soft_deleted_quotes`, `downgrade_expired_plans` but many are not defined in schema/migrations | Multiple files | Runtime errors when these RPCs are called |
| H7 | **Rate limiting uses in-memory fallback in serverless** — `localStore` Map resets on every cold start in Vercel serverless functions | rate-limit.ts:46-93 | Rate limiting ineffective in production |
| H8 | **No CSRF protection on state-changing API routes** — All POST/PATCH/DELETE routes vulnerable to CSRF | All API routes | Cross-site request forgery possible |

### MEDIUM — Quality, DX, and UX Issues

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| M1 | **QuoteWizard is 1084+ lines** — Single massive component with drag-and-drop, voice, validation, save logic | quote-wizard.tsx | Hard to maintain, test, or extend |
| M2 | **DashboardShell is 684 lines** — Contains duplicate logic, inline upgrade popup, export functions | DashboardShell.tsx | Should be split into smaller components |
| M3 | **`resend` dependency unused if SMTP preferred** — `resend` package is in deps but should be optional | package.json, email.ts | Unnecessary dependency if switching to SMTP |
| M4 | **No structured logging** — All errors use `console.error` with varying formats | Throughout | Hard to debug in production |
| M5 | **Email error swallowing** — All email functions catch and only `console.error`; callers never know if email failed | email.ts | Silent delivery failures |
| M6 | **`create-razorpay-order` PUT handler signature verification is incomplete** — Only checks `orderId|paymentId`, missing Razorpay's `paymentLinkId` in some flows | create-razorpay-order/route.ts:203-209 | Payment verification could be bypassed |
| M7 | **No invoice CRUD API** — Invoices are created via RPC but there's no REST API for listing, updating, or deleting invoices | Missing | Can't manage invoices beyond viewing |
| M8 | **No payment recording API** — Payments table exists but no API to record manual payments | Missing | Can't track offline/bank transfer payments |
| M9 | **Team invite flow incomplete** — Invites are created with tokens but no accept-invite flow or email notification | team/route.ts | Team members can't actually join |
| M10 | **`/api/webhooks` references `webhooks` table not in schema** — Table not defined in schema.sql or migrations | webhooks/route.ts, schema.sql | Webhook feature completely broken |

### LOW — Polish and Maintenance

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| L1 | **README.md is boilerplate** | README.md | Poor developer onboarding |
| L2 | **PROJECT_DOCUMENTATION.md is outdated** | PROJECT_DOCUMENTATION.md | Misleading documentation |
| L3 | **No coverage threshold in vitest config** | vitest.config.ts | Regressions can slip through |
| L4 | **`google-site-verification` metadata is empty** | layout.tsx | Google Search Console not verified |
| L5 | **`add_payments_and_due_date.sql` not numbered** — Migration file naming inconsistent | supabase/migrations/ | Migration ordering confusion |
| L6 | **No `.env` validation on startup** | Missing | App starts with missing env vars, fails at runtime |
| L7 | **Chat bot component exists but non-functional** | chat-bot.tsx | Dead code |
| L8 | **Voice engine has locale support but limited testing** | voice-engine.ts, voice-locales.ts | Voice may not work for all declared locales |

---

## 5. Completion Roadmap

### Phase 1: Fix Critical Schema & Data Integrity Issues
**Goal:** Make all existing features actually work end-to-end.

| Task | Files Affected | Details |
|------|---------------|---------|
| 1.1 Add `invoice_items` table to schema + migration | schema.sql, new migration | Mirror `quote_items` structure with `invoice_id` FK |
| 1.2 Add missing columns to `invoices` table | schema.sql, new migration | `client_address`, `client_phone`, `subtotal`, `discount`, `discount_type`, `gst_rate`, `gst_amount`, `paid_amount`, `terms`, `notes`, `payment_terms`, `balance_due` |
| 1.3 Add missing columns to `quotes` table | schema.sql, new migration | `parent_quote_id`, `version` |
| 1.4 Create `webhooks` table | schema.sql, new migration | `id, user_id, url, events (text[]), secret, active, created_at, updated_at` |
| 1.5 Define all missing RPC functions | new migration | `get_quote_admin`, `get_profile_admin`, `get_quote_items`, `record_quote_action`, `next_quote_number`, `apply_coupon`, `check_team_limit`, `cleanup_expired_admin_sessions`, `purge_soft_deleted_quotes`, `downgrade_expired_plans`, `create_invoice_from_quote` |
| 1.6 Fix cron `getEmail()` to fetch from auth.users | cron/route.ts | Query `auth.users` or store email in profiles |
| 1.7 Consolidate `getUser` into single lib function | auth.ts, create-razorpay-order/route.ts, invoice-pdf/route.ts | Remove duplicates, use single import |

### Phase 2: Harden Security & Reliability
**Goal:** Production-grade security posture.

| Task | Files Affected | Details |
|------|---------------|---------|
| 2.1 Add auth to `/api/webhooks/trigger` | webhooks/trigger/route.ts | Require user auth + verify user owns the webhooks being triggered |
| 2.2 Fix `/api/webhooks` auth (use `getUser` from lib) | webhooks/route.ts | Replace broken `createAdminClient().auth.getUser()` |
| 2.3 Add webhook idempotency to Razorpay handler | webhook/route.ts | Track processed event IDs in DB |
| 2.4 Switch email from Resend to Gmail SMTP | email.ts, package.json | Use nodemailer (already in deps); make Resend optional |
| 2.5 Add Zod input validation to critical API routes | All API routes | Validate request bodies; return structured errors |
| 2.6 Add CSRF protection | middleware.ts, API routes | SameSite cookies + CSRF token for state-changing ops |
| 2.7 Add structured logging | New lib/logger.ts | Replace console.error with structured JSON logs |
| 2.8 Add env var validation on startup | New lib/env.ts | Fail fast if required env vars missing |

### Phase 3: Complete Missing Core Features
**Goal:** Fill gaps that block a production-ready SaaS.

| Task | Files Affected | Details |
|------|---------------|---------|
| 3.1 Build invoice CRUD API | New: `/api/invoices/route.ts` | List, get, update, delete invoices |
| 3.2 Build payment recording API | New: `/api/payments/route.ts` | Record manual/offline payments against invoices |
| 3.3 Complete team invite flow | team/route.ts, new accept-invite page | Email invite link → accept → join team |
| 3.4 Add "Send Quote Email" button to quote detail UI | QuoteDetailClient.tsx | Trigger `/api/send-quote-email` from UI |
| 3.5 Add invoice creation UI | InvoicesClient.tsx | Convert quote to invoice with UI |
| 3.6 Add payment tracking UI | InvoiceDetailClient.tsx | Show paid amount, balance due, payment history |
| 3.7 Add activity timeline to quote detail | QuoteDetailClient.tsx, activity.ts | Show quote lifecycle events |
| 3.8 Add "Send Changes Request" email notification | email.ts, public-quote-action/route.ts | Notify user when client requests changes |

### Phase 4: Production Readiness & Observability
**Goal:** Ship-ready with monitoring, testing, and documentation.

| Task | Files Affected | Details |
|------|---------------|---------|
| 4.1 Add test coverage thresholds | vitest.config.ts | Enforce 80%+ coverage on lib/ |
| 4.2 Add API route tests for uncovered routes | New test files | cron, duplicate-quote, export-all, track, webhooks |
| 4.3 Add E2E test for quote create → send → accept flow | e2e/quote-flow.spec.ts | Full user journey test |
| 4.4 Add E2E test for payment flow | e2e/payment.spec.ts | Upgrade + webhook processing |
| 4.5 Write proper README | README.md | Project-specific setup, architecture, deployment |
| 4.6 Delete PROJECT_DOCUMENTATION.md or update it | PROJECT_DOCUMENTATION.md | Remove outdated docs |
| 4.7 Add pre-deploy env check script | pre-deploy-check.sh (enhance) | Validate all env vars before deploy |
| 4.8 Add health check with dependency verification | api/health/route.ts | Check Supabase connectivity |
| 4.9 Refactor QuoteWizard into smaller components | quote-wizard.tsx → components/ | Split into Step1-4 components |
| 4.10 Refactor DashboardShell | DashboardShell.tsx → components/ | Extract upgrade popup, export logic |

### Phase 5: Polish & Performance
**Goal:** Great UX and fast load times.

| Task | Files Affected | Details |
|------|---------------|---------|
| 5.1 Add loading/empty/error states to all pages | Various client components | Improve UX during data fetch |
| 5.2 Optimize landing page bundle | page.tsx, landing/ components | Code-split Framer Motion animations |
| 5.3 Add CDN caching headers to static assets | next.config.ts | Cache-Control for PDFs, logos |
| 5.4 Add database indexes for common queries | New migration | Composite indexes on quotes(user_id, status, created_at) |
| 5.5 Add keyboard shortcut discoverability | use-keyboard-shortcuts.ts, UI hints | Show shortcuts in UI |
| 5.6 Set up Google Search Console verification | layout.tsx | Add verification meta tag |
| 5.7 Remove dead code (chat-bot, unused components) | chat-bot.tsx, etc. | Reduce bundle size |

---

## 6. Paid Service Replacement Plan

| Current | Replacement | Effort | Notes |
|---------|-------------|--------|-------|
| Resend (email) | Gmail SMTP via nodemailer | Low | nodemailer already in deps; SMTP env vars already defined; free |
| Sentry (errors) | Keep — free tier (5K errors/mo) sufficient | None | No replacement needed |
| Razorpay (payments) | Keep — pay-per-transaction, no monthly fee | None | Unavoidable for payment processing |
| Supabase (DB/Auth) | Keep — free tier sufficient | None | Core infrastructure |
| Vercel (hosting) | Keep hobby tier or self-host on Railway/Docker | Optional | Free tier sufficient for early stage |

**Net result after changes: $0/month in API/service costs** (excluding Razorpay transaction fees which are unavoidable for any payment processing).

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema migration breaks existing data | Medium | High | Test migrations on copy first; add rollback scripts |
| SMTP rate limiting by Gmail | Low | Medium | Use Resend as fallback; add queue for bulk sends |
| Razorpay webhook failures | Medium | High | Idempotency + retry logic + manual reconciliation UI |
| Serverless cold start affects rate limiting | High | Low | Use Supabase RPC for rate limiting (already implemented) |
| Voice input not working on all browsers | Medium | Low | Graceful degradation; Web Speech API is well-supported |

---

## 8. Effort Estimate

| Phase | Estimated Effort | Risk |
|-------|-----------------|------|
| Phase 1: Schema & Data Integrity | 2-3 days | Medium |
| Phase 2: Security & Reliability | 2-3 days | Low |
| Phase 3: Missing Core Features | 3-4 days | Medium |
| Phase 4: Production Readiness | 2-3 days | Low |
| Phase 5: Polish & Performance | 1-2 days | Low |
| **Total** | **10-15 days** | |

---

## 9. Next Action

**Start with Phase 1** — fix the critical schema and data integrity issues that prevent existing features from working. This includes adding missing tables, columns, RPC functions, fixing the cron email bug, and consolidating the duplicated `getUser` function.

All changes will be made in small, reviewable commits with tests where applicable. No new paid APIs or services will be introduced.
