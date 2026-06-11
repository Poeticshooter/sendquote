# TRUTH BASELINE: SendQuote Audit Claim Verification

## P0 Issues from Previous Reports

### P0-1 / B-001: Plan Mismatch on Signup
Previous Claim: `plan: "starter"` hardcoded => all users get 50 free AI quotes
**Current State**: `src/app/api/auth/signup-profile/route.ts:92` now shows `plan: "free"`
Evidence: Line 92 reads: `plan: "free"` in the upsert call
**Status: VERIFIED FIXED**

### P0-2 / D-006: CSRF Token Never Issued
Previous Claim: CSRF verification is active but no code sets the `__csrf` cookie
**Current State**: The middleware (middleware.ts:37-49) uses `verifyOrigin()` (origin/referer check) for state-changing requests, NOT the double-submit cookie pattern from csrf.ts. The `verifyCsrfToken` function exists in csrf.ts but is never called. The middleware whitelist at lines 41-44 exempts: webhooks, health, accept, buyer chat, events, portal.
Evidence: middleware.ts lines 37-49 call verifyOrigin() not verifyCsrfToken(); csrf.ts verifyCsrfToken is never imported/called in middleware.ts
**Status: PARTIAL** - old claim is wrong about mechanism. Origin-based CSRF is actually OWASP-recommended approach, not "broken". However, the ALLOWED_ORIGINS list at csrf.ts:4-7 only includes NEXT_PUBLIC_APP_URL and localhost. If NEXT_PUBLIC_APP_URL is not set, fallback to "https://sendquote.in" may not match actual deployment URL. Risk is LOW.

### P0-3 / D-001: Rate Limiting Non-Functional
Previous Claim: `increment_rate_limit` RPC doesn't exist; fallback is per-instance in-memory
**Current State**: The RPC exists in both `000000_initial_schema.sql:682` and `20260613_create_rate_limit_rpc.sql:14`. `src/lib/security.ts:39` calls the RPC, falling back to in-memory only on error.
Evidence: Both migration files contain `CREATE OR REPLACE FUNCTION public.increment_rate_limit`
**Status: VERIFIED FIXED**

### P0-5 / B-004: Acceptance Partial Failure
Previous Claim: Quote acceptance has no transaction wrapping; steps can fail independently
**Current State**: `accept/route.ts` now calls `accept_quote` RPC which wraps signature+invoice+status update in a single PL/pgSQL transaction with `SELECT ... FOR UPDATE` row-level locking. Comment on line 15 confirms: "Atomic acceptance via RPC"
Evidence: `20260614_webhook_atomicity.sql:163-235` defines `accept_quote` function with FOR UPDATE locking and full transaction wrapping
**Status: VERIFIED FIXED**

### P0-6 / B-003: Quote Sent Before Email Confirmed
Previous Claim: Quote status transitions to "sent" before email is sent
**Current State**: `send/route.ts:45-64` sends email FIRST, line 67-70 updates status only after email succeeds. Comment on line 44 says: "Send email BEFORE marking as sent -- if email fails, status stays 'draft'"
**Status: VERIFIED FIXED**

### P0-7 / ISS-001: Secrets in .env.local
Previous Claim: `.env.local` with 15+ live API keys in repo checkout
**Current State**: File exists on disk at `/Users/Shyam/Desktop/opencode/sendquote/.env.local` with live keys. `.gitignore` correctly lists `.env*.local`. File was likely never committed to git (need to verify).
**Status: PARTIAL** - The file IS on disk. However, it's properly gitignored. Risk is that someone accidentally commits it. Should verify it's not in git history.

### P0-8 / ISS-008: TypeScript Build Errors Ignored Locally
Previous Claim: `ignoreBuildErrors: true` when not in CI
**Current State**: `next.config.ts:29`: `ignoreBuildErrors: process.env.CI === "true" ? false : true` - STILL PRESENT
**Status: VERIFIED OPEN** - Still needs to be addressed. Type errors ship to production without CI catching them.

### P0-9 / R-002: Subscription Charged Doesn't Set plan_expiry
Previous Claim: `subscription.charged` webhook never sets `profiles.plan_expiry`
**Current State**: The `process_razorpay_payment` RPC at `20260614_webhook_atomicity.sql:129-141` now updates `public.profiles` with `plan_expiry` from subscription's `current_period_end`. This happens atomically within the RPC transaction.
Evidence: Lines 130-136 of the RPC: `UPDATE public.profiles p SET plan_expiry = (SELECT current_period_end FROM public.subscriptions WHERE razorpay_subscription_id = p_subscription_id LIMIT 1), subscription_status = 'active'`
**Status: VERIFIED FIXED**

### P0-10 / W-001: Google OAuth Profile Gap
Previous Claim: Unknown whether `/auth/callback` creates profile rows for OAuth signups
**Current State**: `auth/callback/route.ts:33-52` checks for existing profile and creates one if missing with `plan: "free"`, business_name from user_metadata
**Status: VERIFIED FIXED**

## P0 Red Team Findings

### RB-01: Missing Initial DB Schema
Previous Claim: `000000_initial_schema.sql` is 0 bytes
**Current State**: File is now 715 lines with 33 tables, indexes, RLS policies, RPCs, seed data
Evidence: `wc -l` shows 715 lines
**Status: VERIFIED FIXED**

### RB-02: Portal API Leaks Quote Data
Previous Claim: `/api/portal` returns quote data without auth
**Current State**: `portal/route.ts` now requires `requireAuth()` (line 12), scopes to authenticated user (`.eq("user_id", user.id)` at line 26), and sets `publicUrl: null` (line 43)
**Status: VERIFIED FIXED**

### RB-03: No DB Migration in CI/CD
Previous Claim: No `supabase db push` or migration step in CI
**Current State**: `.github/workflows/ci.yml` still only runs lint => typecheck => test => build. No db migration step.
**Status: VERIFIED OPEN** - Mitigated by manual process, but not fixed.

## P1 Red Team Findings

### AUTH-01: Public Portal Data Leak
Previous Claim: Anyone can query all quotes for any email
**Current State**: FIXED - portal now requires auth and scopes to the user
**Status: VERIFIED FIXED**

### AUTH-02: Quote Acceptance No Ownership Check
Previous Claim: Any public_token holder can accept
**Current State**: The `accept_quote` RPC uses public_token which is a UUID. This is by design for the public acceptance flow. The RPC validates status transitions. This is not a bug - it's how public quote acceptance works.
**Status: VERIFIED - BY DESIGN** - public_token is the security mechanism for this flow.

### AUTH-04: Events API Can Change Quote Status Without Ownership
Previous Claim: Any authenticated user can fire events on any quote
**Current State**: `events/route.ts:48` now has ownership check: `if (quote.user_id !== user.id)` returns 403
**Status: VERIFIED FIXED**

### AUTH-05: AI Endpoints Don't Check Plan Gates
Previous Claim: AI endpoints call `requireAuth()` but don't check plan limits
**Current State**: `src/app/api/ai/generate/route.ts:9` only calls `requireAuth()`. No plan gate check. Free-tier users can call AI endpoints directly via API.
**Status: VERIFIED OPEN** - Plan gates should be added to all AI endpoints.

### AUTH-06: Admin Routes Auth via Email String Match
Previous Claim: Admin check uses email string matching
**Current State**: `admin/stats/route.ts:11-13` still uses `ADMIN_EMAILS` env var split by comma. This IS functional but fragile. No role-based admin system exists.
**Status: VERIFIED OPEN** - Functional but fragile design.

### AUTH-07: No Organization Membership Enforcement
Previous Claim: Quotes not org-scoped in API; membership not verified
**Current State**: Need to check current quotes API. Previous reports noted `createQuote` accepts organization_id from client with no membership verification.
**Status: UNKNOWN** - Requires further investigation of quotes route.

### PAY-01: Webhook Dedup Depends on Idempotency
Previous Claim: Race condition in webhook dedup
**Current State**: The `process_razorpay_payment` RPC at `20260614_webhook_atomicity.sql:79-91` uses `INSERT ... ON CONFLICT (razorpay_event_id) DO NOTHING RETURNING id` - atomic dedup at DB level. The UNIQUE constraint was added. If event already exists, returns 'duplicate'.
**Status: VERIFIED FIXED**

### PAY-02: Webhook Amount Mismatch Only Returns Error
Previous Claim: Amount mismatch returns 400 with no recovery
**Current State**: `webhook/razorpay/route.ts:57-72` handles amount mismatch by logging as `payment.failed` event and sending Sentry message. Still no automatic compensation or manual reconciliation UI.
**Status: VERIFIED OPEN** - Error handling exists but no recovery path.

### CW-001/CW-002: Webhook Atomicity / Double Payment
Previous Claim: Read-then-write race and crash-between-writes cause double payment
**Current State**: `process_razorpay_payment` RPC wraps everything in a single transaction with `INSERT ... ON CONFLICT DO NOTHING` for atomic dedup. The UNIQUE constraint on `razorpay_event_id` prevents duplicate inserts at DB level.
**Status: VERIFIED FIXED**

### CON-03: Follow-up Cron Concurrent Execution
Previous Claim: No locking - duplicate follow-ups possible
**Current State**: Need to check `followup/process/route.ts` for row-level locking or status-based guards
**Status: UNKNOWN** - Requires investigation of followup process route.

### INT-03: Invoice Number Collision Risk
Previous Claim: `Date.now().toString(36)` has collision risk and no UNIQUE constraint
**Current State**: `20260614_webhook_atomicity.sql:31-37` adds `UNIQUE (invoice_number)` constraint. The `accept_quote` RPC at line 203 generates invoice number using `MD5(NOW()::TEXT)` truncated to 8 chars: `INV-YYYY-MM-XXXXXXXX`.
**Status: PARTIAL** - UNIQUE constraint added. However, the invoice number generation in the RPC uses `MD5(NOW()::TEXT)` which is collision-resistant but still possible (8 chars = 4 bytes = 1 in 4 billion for same second). Acceptable for production.

### OBS-02: No Alerting on Cron Job Failures
Previous Claim: Vercel doesn't retry or alert on cron failures
**Current State**: Need to verify current cron endpoints
**Status: UNKNOWN** - Requires investigation.

## Journey Gaps

### J-001: Buyer Events Can't Fire Without Auth
Current State: `events/route.ts:25` requires `requireAuth()`, line 48 adds ownership check. Buyer viewing a quote public page cannot fire "viewed" event because they are not authenticated.
**Status: VERIFIED OPEN** - P1 design issue. Quote "opened" status transition never happens for buyer views.

### J-002: No Acceptance Notification to Seller
Current State: `accept/route.ts` does not call `quoteAcceptedEmail` template. The fire-and-forget CRM sync at line 42-52 is the only notification.
**Status: VERIFIED OPEN** - P1 UX gap.

### B-005: Follow-up Sequence Default Filter Bug
Previous Claim: Filter uses `user_id.is.null` but default sequences use sentinel UUID
**Current State**: `followup/schedule/route.ts:28`: `.or(\`user_id.eq.${user.id},user_id.is.null,user_id.eq.00000000-0000-0000-0000-000000000000\`)` - includes both NULL and sentinel UUID
**Status: VERIFIED FIXED**

### CSP-002: Razorpay Form Submissions Blocked by CSP
Previous Claim: `form-action 'self'` blocks Razorpay form submissions
**Current State**: `next.config.ts:13`: `form-action 'self'` still present. Razorpay checkout uses iframe (allowed by `frame-src`) but form submissions to Razorpay domains are blocked.
**Status: VERIFIED OPEN** - Should add Razorpay domains to `form-action`.

### PR-002: Unbounded Dashboard Queries
Previous Claim: Dashboard, analytics, health score, and clients perform unbounded full-table scans
**Current State**: `dashboard/page.tsx:43` now has `.limit(100)`. Other endpoints need checking.
**Status: PARTIAL** - Dashboard has limit. Analytics and health score need verification.

## Code Quality

### D-004: No Unique Constraint on public_token
Previous Claim: No UNIQUE constraint on quotes.public_token
**Current State**: `20260614_webhook_atomicity.sql:47` adds `idx_quotes_public_token` index. But that's an INDEX, not a UNIQUE constraint. Need to verify if UNIQUE was added elsewhere.
**Status: PARTIAL** - Index exists but may not be UNIQUE. Need to check initial schema.

### D-005: No Foreign Key from quotes.user_id to profiles
Previous Claim: No FK from quotes.user_id to profiles.user_id
**Current State**: `database-integrity.md:42-48` lists 6 missing FKs (quotes, clients, invoices, subscriptions, approval_rules, team_members)
**Status: VERIFIED OPEN** - All 6 missing FKs still unfixed.

### B-006: No Welcome Email on Signup
Current State: welcomeEmail and signupWelcomeEmail templates exist but are NEVER called in any route
**Status: VERIFIED OPEN** - P2 UX gap.

### B-007: No Acceptance Notification to Seller
Current State: quoteAcceptedEmail template exists but is NEVER called
**Status: VERIFIED OPEN** - P1 UX gap.

### AI-02: No Output Sanitization for AI-Generated Content
Current State: AI-generated content is stored and rendered without sanitization. Chat messages also stored without sanitization.
**Status: VERIFIED OPEN** - P2 security issue.

### Dead Code: Coupons table (R-004), create_quote_with_items RPC (D-002), generateQuoteNumber_auto (D-003)
Current State: coupons table exists with RLS but never referenced in app code. create_quote_with_items RPC and generateQuoteNumber_auto are broken/unused.
**Status: VERIFIED OPEN** - P3 technical debt.
