# Production Readiness Red Team V4 — Final Adversarial Review

---

## ISSUE FOUND: PR-001 — Webhook Race Condition Allows Invoice Double-Payment

**Severity**: P0  
**Confidence**: 95%  
**Type**: Payment Integrity / Concurrency

### Execution Path
```
Razorpay sends payment.captured webhook (eventId = payment.entity.id)
→ Two copies arrive nearly simultaneously (Vercel invokes twice)
→ Request A: dedup check (line 39-47) → existing = null → proceeds
→ Request B: dedup check (line 39-47) → existing = null → proceeds (no lock held)
→ Request A: UPDATE invoice SET paid_amount = balance_due, status = 'paid'
→ Request B: UPDATE invoice SET paid_amount = balance_due + amount, status = 'paid'
→ Request A: INSERT webhook_events (line 107-112)
→ Request B: INSERT webhook_events (line 107-112) — succeeds, no UNIQUE constraint
→ Invoice shows overpayment. No anomaly alert. No recovery.
```

### Files
- `src/app/api/webhook/razorpay/route.ts:39-47` (dedup check — read without lock)
- `src/app/api/webhook/razorpay/route.ts:107-112` (event insert — no UNIQUE constraint)

### Root Cause
1. **Read-then-write without locking**: The dedup check at line 39-47 reads `webhook_events` for `razorpay_event_id`. Between the read and the write at line 107, a concurrent request can also read "not found" and proceed.
2. **No UNIQUE constraint on `webhook_events.razorpay_event_id`**: Even if the dedup worked perfectly, there's no database-level protection.
3. **Invoice update and event logging are not atomic**: If the invoice update succeeds but the event insert crashes, the webhook retry adds the payment again (since the eventId isn't logged yet).

### Business Impact
- **Revenue**: Actual double-payment with no automatic detection. Seller sees overpayment.
- **Probability**: LOW at current scale (first 10 customers), but INCREASES with volume. Each webhook delivery has a small chance of Vercel invoking it twice.
- **Detection**: No alert exists for overpayment. Would go unnoticed until manual reconciliation.

### Reproduction
1. Create a quote, accept it, generate payment order
2. Hit `/api/webhook/razorpay` twice simultaneously with the same payment.captured payload
3. Observe invoice.paid_amount > invoice.amount after both complete

### Recommended Fix
1. Add `UNIQUE` constraint on `webhook_events.razorpay_event_id`
2. Wrap the payment processing in a PostgreSQL function (atomic RPC) that inserts the event AND updates the invoice in one transaction
3. Add an idempotency key check: `INSERT ... ON CONFLICT (razorpay_event_id) DO NOTHING RETURNING id` — if no row returned, it's a duplicate

### Estimated Fix Time: 2-3 hours

---

## ISSUE FOUND: PR-002 — Dashboard and Analytics Perform Unbounded Full-Table Scans

**Severity**: P1 (becomes P0 after ~500 quotes)  
**Confidence**: 100%  
**Type**: Performance / Scalability

### Execution Path
```
User visits dashboard
→ dashboard/page.tsx line 39:
  supabase.from("quotes").select("...").eq("user_id", user.id)
  → NO limit() clause → returns ALL quotes (10k+ rows)
→ health-score/route.ts line 12:
  .from("quotes").select(...).eq("user_id", user.id)
  → NO limit() clause → returns ALL quotes
→ analytics/route.ts line 39:
  .from("quotes").select(...).eq("user_id", user.id)
  → NO limit() clause → returns ALL quotes
→ clients/page.tsx line 25:
  .from("clients").select(...).eq("user_id", user.id)
  → Has pagination via .range() but the COUNT query is unscoped
```

### Files Affected
- `src/app/(dashboard)/dashboard/page.tsx:39-43` — no limit
- `src/app/api/health-score/route.ts:12` — no limit
- `src/app/api/analytics/route.ts:39,53` — no limit on count query
- `src/app/api/clients/route.ts:12-16` — API GET has no limit

### Business Impact
- At 1,000 quotes: dashboard API returns ~200KB of data, 500ms query time
- At 10,000 quotes: returns ~2MB, 3-5s query time, Vercel timeout risk (max 10s)
- At 100,000 quotes: query times out, dashboard breaks entirely
- App becomes unusable for power users

### Probability
- First 10 customers: low impact
- First 100 customers with ~500 quotes each: noticeable slowdown
- Any customer with >1,000 quotes: dashboard becomes unresponsive

### Recommended Fix
Add `.limit(100)` or `.limit(50)` to all unbounded queries. The dashboard only shows recent 5 anyway (`.slice(0, 5)` client-side). Health score can compute from a smaller sample.

### Estimated Fix Time: 30 minutes

---

## ISSUE FOUND: PR-003 — Events API Lets Any Authenticated User Manipulate Any Quote's Status

**Severity**: P1  
**Confidence**: 100%  
**Type**: Authorization

### Execution Path
```
Attacker (authenticated user, not quote owner)
→ POST /api/events
  { "quote_id": "victim-quote-uuid", "event_type": "viewed" }
→ requireAuth() — passes (attacker is logged in)
→ Uses admin client (line 35) — bypasses RLS
→ Inserts quote_event (line 50-61)
→ If quote.status == "sent", transitions to "opened" (line 65-70)
→ Victim's quote status changed by non-owner
```

### Files
- `src/app/api/events/route.ts:25` — auth check only verifies login, not ownership
- `src/app/api/events/route.ts:35` — admin client bypasses RLS
- `src/app/api/events/route.ts:65-70` — side effect: status transition

### Business Impact
- **Analytics manipulation**: Attacker can inflate view counts
- **Status corruption**: Quote shows as "opened" when it was never viewed by the actual client
- **No data exfiltration** (quote data is not returned) — privacy impact is low
- **Damage to trust**: Seller sees fraudulent engagement data

### Probability
- Requires knowing a valid quote_id (UUID — not guessable)
- But quote_id is exposed in the dashboard HTML and API responses to the quote owner's browser
- Any authenticated user can enumerate their own quote_ids and try others

### Recommended Fix
Add ownership check before processing: verify `quote.user_id === auth.uid()` before inserting the event.

### Estimated Fix Time: 30 minutes

---

## ISSUE FOUND: PR-004 — Invoice Number Collision Under Concurrent Acceptance

**Severity**: P1  
**Confidence**: 70%  
**Type**: Concurrency / Data Integrity

### Execution Path
```
Two buyers accept the same quote simultaneously
→ Request A: invoiceNumber = "INV-2026-6-${Date.now().toString(36).toUpperCase()}"
→ Request B: invoiceNumber = same value (same millisecond, ~1% chance)
→ Request A: INSERT invoice with invoiceNumber → succeeds
→ Request B: INSERT invoice with same invoiceNumber → 
  → If UNIQUE constraint exists: throws, acceptance fails with 500
  → If NO UNIQUE constraint: two invoices with the same number
```

### Files
- `src/app/api/quotes/accept/route.ts:41` — `Date.now().toString(36)` has ~1ms precision
- Unique constraint on `invoices.invoice_number` — NOT confirmed in any migration

### Business Impact
- Duplicate invoice numbers cause accounting confusion
- If no unique constraint: both invoices exist with identical numbers, different data
- At first 10 customers: probability is very low (~1 in 1000 concurrent acceptances)
- At scale: probability increases linearly

### Recommended Fix
1. Add `UNIQUE` constraint on `invoices.invoice_number` (idempotent migration)
2. Improve invoice number generation to include a random component: `INV-${year}-${month}-${random(4)}-${timestamp}`

### Estimated Fix Time: 30 minutes

---

## ISSUE FOUND: PR-005 — Follow-up Cron Sends Duplicate Emails Under Concurrent Execution

**Severity**: P2  
**Confidence**: 90%  
**Type**: Concurrency / Reliability

### Execution Path
```
Vercel invokes cron at 9:00:00
→ Request A: select pending follow-ups WHERE scheduled_at <= now (rows 1-50)
→ Request B: select pending follow-ups WHERE scheduled_at <= now (same rows)
→ Request A: send email for row 1, update status to "sent"
→ Request B: send email for row 1 (status still "pending" in Request B's view), update status to "sent"
→ Client receives two identical follow-up emails
```

### Files
- `src/app/api/followup/process/route.ts:24-29` — read without lock
- `src/app/api/followup/process/route.ts:35-101` — process loop, no row locking

### Business Impact
- Clients receive duplicate follow-up emails
- Annoying but not destructive
- Probability increases with Vercel cold-start concurrency

### Recommended Fix
Add status filter to the update: `.eq("status", "pending")` before marking as "sent", so the second concurrent update affects 0 rows.

### Estimated Fix Time: 15 minutes

---

## ISSUE FOUND: PR-006 — Webhook Processing Not Atomic — Partial Failure Causes Double-Payment on Retry

**Severity**: P0  
**Confidence**: 85%  
**Type**: Payment Integrity

### Execution Path
```
Webhook processing for payment.captured:
→ Step 1: UPDATE invoice SET paid_amount = newPaid, status = 'paid' (line 79-87)
→ Step 2: INSERT webhook_events (line 107-112)
→ CRASH between Step 1 and Step 2 (Vercel timeout, DB error, process kill)
→ Razorpay retries webhook delivery
→ Step 1 (retry): Reads invoice — paid_amount already has previous value
→ Calculates newPaid = paid_amount + paymentAmount AGAIN
→ UPDATE invoice SET paid_amount = previousPaid + paymentAmount (DOUBLE PAYMENT)
→ Step 2 (retry): INSERT webhook_events succeeds
→ Invoice shows overpayment. No recovery path.
```

### Files
- `src/app/api/webhook/razorpay/route.ts:79-87` — invoice update
- `src/app/api/webhook/razorpay/route.ts:107-112` — event log (separate transaction)

### Business Impact
- **Money is collected but the system records double the actual payment**
- No automatic detection — seller sees paid_amount > amount
- No alerting for overpayment
- Manual reconciliation required to correct

### Probability
- LOW — requires a crash between two DB operations within the same request
- But Vercel serverless functions can be killed at any time (memory limit, CPU limit, 10s timeout)
- The 10s timeout window makes this possible under load

### Recommended Fix
Wrap invoice update + event logging in a single Supabase RPC transaction, OR reverse the order (log event first, then update invoice — if crash occurs after event log, retry detects duplicate and skips).

### Estimated Fix Time: 3-4 hours

---

## VERIFIED SAFE: Acceptance Race Condition (Previously P0-005)

The acceptance flow now correctly:
1. Creates invoice before updating quote status ✅
2. Uses `.eq("status", "sent")` race-condition guard ✅
3. Compensates by deleting invoice if race is lost ✅

---

## VERIFIED SAFE: Webhook Signature Verification

HMAC-SHA256 with timing-safe comparison. Razorpay webhooks are properly authenticated. ✅

---

## VERIFIED SAFE: Quote Authorization (most endpoints)

All quote-scoped API endpoints check `user_id === auth.uid()`. Contracts, CRM sync, approval rules, health score, analytics, chat, quotes CRUD all verify ownership. ✅

---

## Summary

| ID | Issue | Severity | Fix Time | Affects First 10? | Affects First 100? |
|---|---|---|---|---|---|
| PR-001 | Webhook race double-payment | **P0** | 2-3h | Possible | Probable |
| PR-006 | Webhook partial failure on retry | **P0** | 3-4h | Possible | Probable |
| PR-002 | Unbounded dashboard queries | **P1** | 30min | No | Over 500 quotes |
| PR-003 | Events API status manipulation | **P1** | 30min | Possible | Likely |
| PR-004 | Invoice number collision | **P1** | 30min | Very unlikely | Possible |
| PR-005 | Duplicate follow-up emails | **P2** | 15min | Unlikely | Possible |

## Final Verdict: ISSUES FOUND

Two P0 payment integrity issues exist. Both require webhook/database fixes before launch.

**Estimated fix time for all P0+P1 issues: 4-6 hours.**

Once PR-001 and PR-006 are resolved, the system is safe for first 100 customers.
