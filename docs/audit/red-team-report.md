# Red Team Assessment Report

---

## PHASE 1 — AUTHORIZATION ATTACK RESULTS

### AUTH-01: Public API Endpoints Leak Quote Data Without Ownership Check

**Result**: FAIL  
**Risk**: P0 (Launch blocker)  
**Endpoint**: `POST /api/portal`  
**File**: `src/app/api/portal/route.ts`  

**Attack**: Anyone can query all quotes for any email address with zero authentication.

```bash
curl -X POST https://sendquote.in/api/portal \
  -H "Content-Type: application/json" \
  -d '{"email": "target@company.com"}'
```

**Evidence**:
- Uses `createAdminClient()` (bypasses RLS)
- No authentication required
- Only rate-limited by IP (10 req/60s — in-memory, easily bypassed)
- Returns quote numbers, amounts, statuses, and public_tokens
- Email validation is minimal (`includes("@")`)

**Attack Chain**: Enumerate client emails → portal API reveals all quotes with public_tokens → access each quote's full details (items, notes, terms) via `/q/{token}`.

---

### AUTH-02: Quote Acceptance No Ownership Check

**Result**: FAIL  
**Risk**: P1  
**Endpoint**: `POST /api/quotes/accept`  
**File**: `src/app/api/quotes/accept/route.ts`  

**Attack**: Anyone with a valid `public_token` can accept a quote and create an invoice.

**Evidence**:
- Authenticates via public_token, not via user session
- Uses `createAdminClient()` (bypasses RLS)
- No check that the requester is the intended client
- After P0-005 fix: signature stored, invoice created, quote accepted
- `public_token` is a UUID — cannot be guessed, but if leaked via AUTH-01, can be exploited

---

### AUTH-03: Buyer Chat No Authentication

**Result**: FAIL  
**Risk**: P1  
**Endpoint**: `POST /api/chat/buyer`  
**File**: `src/app/api/chat/buyer/route.ts`  

**Attack**: Anyone with a public_token can post messages as a "buyer" to any quote's deal room.

**Evidence**:
- Uses anon key client with public_token only
- No CSRF check (whitelisted in middleware)
- Rate limited via in-memory only
- `sender_name` is self-reported — can impersonate anyone

---

### AUTH-04: Events API Can Change Quote Status Without Ownership

**Result**: FAIL  
**Risk**: P1  
**Endpoint**: `POST /api/events`  
**File**: `src/app/api/events/route.ts`  

**Attack**: An authenticated user (any user) can fire a "viewed" event on ANY quote, not just their own, transitioning it from "sent" to "opened".

**Evidence**:
- `requireAuth()` only confirms the caller is logged in — does NOT check ownership
- No verification that the quote belongs to the authenticated user
- Line 65-70: If `event_type` is "viewed" and quote status is "sent", transitions to "opened"
- Uses admin client for DB operations (bypasses RLS)

---

### AUTH-05: AI Endpoints Enforce Auth But Not Plan Gates

**Result**: FAIL  
**Risk**: P2  
**Endpoints**: `POST /api/ai/generate`, `POST /api/ai/followup`, `POST /api/ai/copilot`

**Evidence**:
- All three call `requireAuth()` but do NOT check plan limits
- `POST /api/ai/generate` line 9: `await requireAuth()` — no plan check
- `POST /api/ai/followup` line 12: `await requireAuth()` — no plan check
- Plan gates are only enforced in `POST /api/quotes` (CREATION), not in AI usage
- A free user (5 quotes/month, AI disabled) can still call AI endpoints directly

---

### AUTH-06: Admin Routes Auth via Email String Match

**Result**: FAIL  
**Risk**: P1  
**File**: `src/app/api/admin/stats/route.ts`  

**Evidence**:
- Admin check at line 11-13: splits `ADMIN_EMAILS` env var by comma and checks if user's email matches
- No role-based access — just email string matching
- If `ADMIN_EMAILS` is not set, `adminEmails` is empty, and the check blocks everyone (line 12: `adminEmails.length === 0`)
- But the admin page UI (`admin/users/page.tsx`) uses `supabase.from("profiles").select("*, users:auth.users!inner(email)")` which requires `auth.users` access — this may fail for non-admin users at the Supabase project level

---

### AUTH-07: No Organization Membership Enforcement

**Result**: FAIL  
**Risk**: P2  

**Evidence**:
- `queries.ts:22-26`: Quotes can be filtered by `orgId`, but:
  1. The API route (`/api/quotes`) doesn't accept an orgId parameter
  2. Even if it did, the query only checks `organization_id` equality — never verifies the user is a member of that org
  3. `organization_members` table exists but is never queried for authorization
- `createQuote`: `organization_id` is accepted from the client with no membership verification

---

## PHASE 2 — PUBLIC TOKEN ATTACK RESULTS

### TOKEN-01: Public Token Has No Uniqueness Constraint

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `src/lib/supabase/queries.ts:91`: `const token = uuid()` — generated, no uniqueness check
- No `UNIQUE` constraint on `quotes.public_token` in any migration
- Public lookup at `getQuoteByToken()` uses `.maybeSingle()` — returns null on collision
- But public quote view page at `q/[token]/page.tsx` uses `admin.from("quotes").select("*, quote_items(*)").eq("public_token", token).single()` — would THROW on duplicate

---

### TOKEN-02: Portal Leaks Full Token URLs

**Result**: FAIL  
**Risk**: P0 (launch blocker as complement to AUTH-01)

**Evidence**:
- `/api/portal` returns `publicUrl: `/q/${q.public_token}`` for each quote
- Combined with AUTH-01 (any email query), this leaks direct access URLs to all quotes
- Full quote details (items, amounts, notes, terms) are then accessible via the public URL

---

## PHASE 3 — PAYMENT ATTACK RESULTS

### PAY-01: Duplicate Payment Protection Depends on Webhook Idempotency

**Result**: PARTIAL FAIL  
**Risk**: P1  

**Evidence**:
- `webhook/razorpay/route.ts:39-47`: Checks for existing `razorpay_event_id` in `webhook_events`
- Deduplication IS implemented
- BUT: if webhook processing succeeds at step 1 (duplicate check) but fails at step 2 (DB write), the eventId IS stored but the payment isn't processed
- The `razorpay_event_id` generation at line 35-37:
  ```typescript
  const eventId = event.event === "payment.captured"
    ? event.payload.payment.entity.id    // Unique per payment
    : `${event.event}_${event.payload?.payment?.entity?.order_id || Date.now()}`;
  ```
- If `payment.entity.id` doesn't exist in the payload for `payment.captured` events, falls back to `Date.now()` — NOT unique
- This means two different payment.captured webhooks could collide on eventId, causing one to be rejected as duplicate

---

### PAY-02: Webhook Amount Mismatch Only Returns Error — No Recovery

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `webhook/razorpay/route.ts:66-76`: If payment amount doesn't match invoice balance_due, returns 400
- The webhook sender (Razorpay) will retry, but will get the same error each time
- No automatic compensation or notification
- The event is logged as `amount_mismatch` but never triggers an alert
- No manual reconciliation process exists

---

### PAY-03: Payment Initiation Doesn't Verify Invoice Status

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `payments/razorpay/route.ts:27`: Checks `quote.status !== "accepted"` — OK
- Line 30-34: Gets invoice `balance_due` — but does NOT check if invoice is already "paid"
- If invoice has `balance_due > 0` (partial payment), a second payment order can be created for the remaining balance
- This is actually correct for partial payments, BUT there's no guard against overpayment (creating payment for more than balance_due)
- The amount comes from `invoice.balance_due` which should be correct, but the UI could send a different `quote_id` with a different amount

---

### PAY-04: Subscription Webhook `subscription.charged` Can Fail Silently

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `webhook/razorpay/route.ts:142-157`: Queries subscription by `razorpay_subscription_id`, updates profile
- Line 146: `.single()` — if the subscription doesn't exist in our DB (e.g., created outside SendQuote), this throws
- The error is caught by the outer try/catch at line 173-175, which returns 500
- Razorpay will retry, but each retry fails the same way
- Expected errors are not logged to Sentry (only unexpected ones in the catch block)
- No fallback for unknown subscriptions

---

## PHASE 4 — AI ABUSE RESULTS

### AI-01: No Per-User AI Rate Limiting

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `POST /api/ai/generate` — no rate limit beyond the global 100 req/min per IP
- A single user could trigger thousands of AI calls, incurring costs
- `generateQuoteAI` uses fallback to local templates when API key is not set, but if key IS set, every request hits the API
- Provider chain: Groq → OpenRouter → Gemini — each has cost implications
- AI cache reduces costs but only for identical prompts

---

### AI-02: No Output Sanitization for AI-Generated Content

**Result**: FAIL  
**Risk**: P2  

**Evidence**:
- `generateQuoteAI` returns AI-generated items, notes, and terms as-is
- The response is parsed from JSON but content is not sanitized
- AI-generated text is rendered in the quote detail page and public quote view
- If AI generates HTML or script tags, they could render unsanitized
- Chat messages from `POST /api/chat/buyer` are also stored and displayed without sanitization

---

## PHASE 5 — CONCURRENCY RESULTS

### CON-01: Quote Number Counter Race Condition (Mitigated)

**Result**: PASS (with caveat)  
**Risk**: P3  

**Evidence**:
- `increment_quote_counter` is an atomic RPC — no race
- However, if the RPC succeeds but the subsequent quote INSERT fails, the counter is incremented and NOT rolled back
- This creates gaps but not duplicates

---

### CON-02: Quote Acceptance Race Condition (Mitigated in P0-005 Fix)

**Result**: PASS  
**Risk**: Previously P0, now mitigated

**Evidence**:
- Acceptance race condition is handled with `.eq("status", "sent")` guard
- Invoice created before status update
- Compensation deletes invoice if status update fails
- Multiple simultaneous acceptances: only the first succeeds, the rest get 409

---

### CON-03: Follow-up Cron Concurrent Execution

**Result**: FAIL  
**Risk**: P2  

**Evidence**:
- `followup/process/route.ts`: Processes all pending follow-ups
- No locking mechanism — if two cron instances run simultaneously (possible at Vercel scale), duplicate follow-ups could be sent
- The query at line 24-29 selects all pending where `scheduled_at <= now` — no row-level locking
- Two concurrent calls would both process the same items

---

## PHASE 6 — DATA INTEGRITY RESULTS

### INT-01: Invalid Status Transitions Prevention

**Result**: PASS  

**Evidence**:
- `queries.ts:143-152`: Valid transition map enforces correct state machine
- `draft → paid`: NOT in transition map — BLOCKED ✅
- `expired → accepted`: NOT in transition map — BLOCKED ✅
- `accepted → draft`: NOT in transition map — BLOCKED ✅

However, the acceptance endpoint (`accept/route.ts`) bypasses this state machine — it directly calls `supabase.from("quotes").update({ status: "accepted" })` with only a `.eq("status", "sent")` guard. It does NOT use `updateQuoteStatus()`.

---

### INT-02: Cascade Deletes Work Correctly

**Result**: PASS (for quote child tables)  

**Evidence**:
- `20260611_fix_fk_cascades.sql`: All child tables of `quotes` have `ON DELETE CASCADE`
- Deleting a quote removes items, events, signatures, messages, approval_requests

But: no cascade from `auth.users` to `profiles` or `quotes`. Deleting a user in Supabase Auth would leave orphaned profiles and quotes.

---

### INT-03: Invoice Number Collision Risk

**Result**: FAIL  
**Risk**: P2  

**Evidence**:
- `accept/route.ts:41`: `INV-${date.getFullYear()}-${date.getMonth() + 1}-${Date.now().toString(36).toUpperCase()}`
- `Date.now()` has millisecond precision — unlikely collision within same month
- But no unique constraint on `invoices.invoice_number` is visible in migrations
- Under high load (multiple acceptances in the same millisecond), collision possible
- No retry logic if invoice insert fails due to collision

---

## PHASE 7 — PRODUCTION READINESS

### PROD-01: Fresh Deployment Will Fail — Missing Initial Schema

**Result**: FAIL  
**Risk**: P0  

**Evidence**:
- `000000_initial_schema.sql` is 0 bytes
- The actual database schema exists only in the production Supabase project
- A fresh deployment to a new Supabase project will have ZERO tables
- All migrations assume tables already exist (they use `ALTER TABLE`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`)
- No `supabase db dump` or schema export exists in the codebase

---

### PROD-02: No Database Migration in CI/CD

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- `ci.yml` runs lint → typecheck → test → build
- No `supabase db push` or migration step
- Deployments can ship code that references tables/columns that don't exist in production

---

### PROD-03: No Rollback Testing

**Result**: FAIL  
**Risk**: P2  

**Evidence**:
- `scripts/vercel-rollback.sh` exists but runs `vercel rollback --yes` without:
  - Running inverse migrations
  - Validating data consistency after rollback
  - Notifying users of the rollback

---

## PHASE 8 — OBSERVABILITY

### OBS-01: Sentry Breadth Is Good but Depth Lacks Context

**Result**: PASS (partial)  

**Evidence**:
- All API routes have `Sentry.captureException(e)` in catch blocks ✅
- But: no custom Sentry tags for user_id, plan_tier, or quote_id
- No performance monitoring on AI provider calls or database queries
- No Sentry breadcrumbs for key business events

---

### OBS-02: No Alerting on Cron Job Failures

**Result**: FAIL  
**Risk**: P1  

**Evidence**:
- Cron jobs `/api/expiry/check` and `/api/followup/process` return 500 on failure
- Vercel doesn't retry or alert on cron failures
- No Sentry alert configured for cron endpoint failures
- If expiry check fails for a day, expired quotes are never marked as expired

---

## PHASE 9 — CUSTOMER JOURNEY

### CJ-01: Signup → No Welcome Email

**Result**: FAIL  
**Risk**: P2  

**Evidence**: Confirmed in V2/V3 — welcome email template exists but is never called.

---

### CJ-02: Quote Acceptance → No Notification to Sender

**Result**: FAIL  
**Risk**: P1  

**Evidence**: `quoteAcceptedEmail` template exists but is never called. Sellers must refresh the dashboard to discover accepted deals.

---

### CJ-03: Free Plan Users Can Access AI Features Via Direct API

**Result**: FAIL  
**Risk**: P1  

**Evidence**: Plan gates are only checked at quote creation. AI endpoints (`/api/ai/generate`, etc.) don't verify plan tier. A free-tier user can call these endpoints directly.
