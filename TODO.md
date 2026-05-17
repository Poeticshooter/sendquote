# SendQuote — Project TODO

## Phase 1: Schema & Data Integrity ✅ COMPLETE
- [x] Migration 000-017 created and pushed
- [x] `schema.sql` synced with all migrations
- [x] RLS policies verified on all tables
- [x] Foreign key constraints and cascades reviewed
- [x] Build/lint/tests green

## Phase 2: Security & Reliability ✅ COMPLETE
- [x] Webhook auth (`/api/webhooks/trigger` + `/api/webhooks` CRUD)
- [x] Razorpay webhook idempotency (migration 018, `webhook_events` table)
- [x] Gmail SMTP primary + Resend fallback (`src/lib/email.ts`)
- [x] Zod input validation on 7 critical routes (`src/lib/validation.ts`)
- [x] Structured logging (`src/lib/logger.ts`)
- [x] Env validation (`src/lib/env.ts`)
- [x] Build/lint/tests green (254 tests)

## Phase 3: CSRF & Session Hardening + UX/Error Handling ✅ COMPLETE
- [x] CSRF double-submit cookie pattern (`src/lib/csrf.ts`, `src/lib/csrf-client.ts`)
- [x] CSRF applied to 9 mutating API routes
- [x] CSRF cookie set in middleware
- [x] Origin/Referer header validation as secondary defense
- [x] Frontend updated to use `csrfFetch` helper
- [x] `CSRF.md` documentation
- [x] User ownership verification audited on all API routes
- [x] `console.error` replaced with structured logger in critical paths
- [x] Test helper `src/test/csrf-helpers.ts`
- [x] 6 test files updated with CSRF token support (260 tests total)
- [x] Build/lint/tests green

## Phase 4: Performance, Observability & Product Polish ✅ COMPLETE
- [x] Migration 019: 4 composite indexes (`quotes(user_id, status)`, `quotes(user_id, created_at DESC)`, `invoices(user_id, status)`, `invoices(user_id, created_at DESC)`)
- [x] Narrowed SELECT * in 3 routes (duplicate-quote, public-quote-action, create-razorpay-order)
- [x] Cron route N+1 fix (batch queries for emails, reminders, overdue checks)
- [x] Logger requestId support added
- [x] Structured logging added to 6 silent flows (duplicate-quote, razorpay, webhooks, clients, cron, export-all)
- [x] Invoice detail empty state (was silent `return null`)
- [x] Invoices page uses shared `EmptyState` component
- [x] `schema.sql` updated to migration 019
- [x] Build/lint/tests green (260 tests)

## Phase 5: Recommended Follow-ups (NOT STARTED)
- [ ] Billing edge cases: subscription renewal failures, proration, refunds
- [ ] Analytics dashboard: quote conversion rate, revenue trends from `analytics_events`
- [ ] Email template customization: user-editable quote/invoice email body
- [ ] Multi-currency support: expand beyond INR
- [ ] Webhook retry logic: exponential backoff for failed deliveries
- [ ] Quote versioning UI: show version history and diff on quote detail
- [ ] `activity_logs` table: create migration (referenced in code but missing from migrations)
- [ ] `cron_reminders` table: create migration (referenced in cron route but missing)
