# Payment Integrity & Concurrency Report V5

---

## Workflow 1: Quote Acceptance → Invoice Creation

**Files**: `src/app/api/quotes/accept/route.ts:8-99`

### Execution Order
```
1. SELECT quote WHERE public_token = X                 (line 14-18)
2. Check quote.status !== "accepted"                    (line 24-26)
3. INSERT quote_signatures                              (line 29-34)
4. INSERT invoices                                      (line 43-57)
5. UPDATE quotes SET status = "accepted" WHERE id = X AND status = "sent"  (line 62-68)
6. If step 5 affected 0 rows → DELETE invoice (compensation)  (line 70-74)
7. INSERT quote_events                                  (line 78-82)
```

### Can it execute twice?
**NO** — Step 5 uses row-level locking via `.eq("status", "sent")`. PostgreSQL serializes concurrent UPDATЕs on the same row. The second request sees `status = "accepted"` and the WHERE clause matches 0 rows → compensation deletes the extra invoice. ✅

### Can concurrent requests create duplicate invoices?
**NO** (with one caveat). Step 5's conditional UPDATE acts as an optimistic lock. However, if Request A's UPDATE (step 5) succeeds but the `quote_events` insert (step 7) fails, the request returns 500. The client retries. Request B reads the quote — status = "accepted" (from Request A's update). Step 2 returns 409 "already accepted". The invoice from Request A exists but there's no invoice linked to Request B. **End state: 1 invoice, 1 accepted quote. Correct.** ✅

### Can retry produce a different result?
**NO** — second retry hits step 2 (`status === "accepted"`) and returns 409. ✅

### Is there a DB-level guarantee?
**PARTIAL** — No `UNIQUE` constraint on `invoices.quote_id`. The protection is entirely in application logic (the `.eq("status", "sent")` guard). If a future code change removes this guard, duplicate invoices are possible.

### Can crash leave partial state?
**YES** — If crash occurs between step 4 and step 5 (invoice inserted but status not updated), the invoice exists with `status = "pending"` but the quote remains `"sent"`. This is recoverable — the invoice can be manually reconciled. **Risk: LOW.** If crash occurs between step 5 and step 7, both the invoice and accepted status exist but the event is missing. **Risk: NEGLIGIBLE.**

---

## Workflow 2: Payment Webhook Processing

**Files**: `src/app/api/webhook/razorpay/route.ts:7-177`

### Execution Order (payment.captured)
```
1. Verify HMAC-SHA256 signature                               (line 22-30)
2. Compute eventId = payment.entity.id                         (line 35-37)
3. SELECT webhook_events WHERE razorpay_event_id = eventId     (line 39-43)
4. If found → return "duplicate"                               (line 45-47)
5. Read orderNotes.quote_id from payment                       (line 54-57)
6. SELECT invoice WHERE quote_id = quoteId                     (line 59-63)
7. Verify paymentAmount matches balance_due                    (line 66-76)
8. UPDATE invoice SET paid_amount += amount, status            (line 79-87)
9. UPDATE subscriptions if applicable                          (line 91-105)
10. INSERT webhook_events                                      (line 107-112)
```

### CRITICAL FINDING: CW-001 — Duplicate Webhook Processing (P0)

**Can it execute twice?** **YES** 🔴

**Scenario**: Two webhook deliveries arrive simultaneously (Vercel invokes twice, or Razorpay's retry overlaps with the initial delivery).

```
Time T0: Request A reads webhook_events → empty [line 39-43]
Time T0: Request B reads webhook_events → empty [line 39-43]  ← SAME READ
Time T1: Request A reads invoice → balance_due = 5000 [line 59-63]
Time T1: Request A UPDATE invoice SET paid_amount = 5000, status = 'paid' [line 79-87]
Time T2: Request B reads invoice → paid_amount = 5000 [line 59-63]
Time T2: Request B newPaid = 5000 + 5000 = 10000  ← DOUBLE COUNTS!
Time T2: Request B UPDATE invoice SET paid_amount = 10000, status = 'paid'
Time T3: Request A INSERT webhook_events → OK [line 107-112]
Time T3: Request B INSERT webhook_events → OK [line 107-112]  ← NO UNIQUE CONSTRAINT
```

**Root cause**: Three distinct failures:
1. **Read-then-write race** (line 39-43): No locking between the dedup check and the event insert
2. **No UNIQUE constraint** on `webhook_events.razorpay_event_id`: The second INSERT at line 107-112 succeeds because there's no database-level duplicate protection
3. **No transaction boundary** between step 8 (invoice update) and step 10 (event insert)

### CRITICAL FINDING: CW-002 — Crash-Between-Writes Causes Double-Payment on Retry (P0)

**Scenario**: Crash or timeout after invoice update but before event insert.

```
Request A:
→ UPDATE invoice (line 79-87) — SUCCESS, paid_amount = 5000
→ [CRASH before line 107 — event insert never happens]
→ Returns error to Razorpay

Razorpay retries webhook (valid — no webhook_event was logged)

Request B (retry):
→ Read webhook_events → empty (never inserted) — SUCCEEDS
→ Read invoice → paid_amount = 5000
→ newPaid = 5000 + 5000 = 10000  ← DOUBLE COUNTS AGAIN
→ UPDATE invoice SET paid_amount = 10000
→ INSERT webhook_events → commits
→ Invoice shows double payment. No recovery.
```

**Root cause**: No atomicity between the invoice update and event logging. They're separate Supabase queries with no transaction wrapping.

### DB-Level Guarantees
| Check | Has Protection? |
|---|---|
| UNIQUE on razorpay_event_id | ❌ **NO** |
| Transaction wrapping invoice + event | ❌ **NO** |
| Row lock between dedup check and insert | ❌ **NO** |
| Idempotent invoice update | ✅ (via read-then-write, but race breaks it) |

---

## Workflow 3: Payment Order Creation

**Files**: `src/app/api/payments/razorpay/route.ts:12-78`

### Execution Order
```
1. requireAuth() → user authenticated                           (line 14)
2. SELECT quote WHERE id = quote_id                             (line 19-23)
3. Check quote.user_id === user.id                              (line 26)
4. Check quote.status === "accepted"                            (line 27)
5. SELECT invoice balance_due WHERE quote_id = quote_id         (line 30-34)
6. amount = invoice.balance_due ?? quote.total                  (line 36)
7. POST to Razorpay API: create order with notes{quote_id}      (line 48-60)
8. Return order details                                         (line 68-74)
```

### Can it execute twice?
**YES** — Nothing prevents the seller from calling this endpoint multiple times for the same quote. Each call creates a new Razorpay order. If the buyer pays all orders, the webhook processes each payment, adding to `paid_amount` each time.

**Impact**: Overpayment is possible. The invoice's `balance_due` decreases with each payment, but there's no upper limit check. Seller could intentionally or accidentally create multiple payment requests.

**Risk**: LOW — requires seller-side action. Buyer would need to authorize each payment in Razorpay's UI.

### DB-Level Guarantees
| Check | Has Protection? |
|---|---|
| Unique constraint on orders per quote | ❌ **NO** (intentional — allows partial payments) |
| Upper limit on total payments | ❌ **NO** |

---

## Workflow 4: Subscription Activation (Webhook)

**Files**: `src/app/api/webhook/razorpay/route.ts:127-160`

### Execution Order
```
1. SELECT subscription WHERE razorpay_subscription_id = id     (line 142-146)
2. UPDATE subscriptions SET status = "active"                   (line 131-139)
3. UPDATE profiles SET plan_expiry = periodEnd                  (line 149-156)
```

### Can it execute twice?
**YES** — Same read-then-write race as CW-001. The `subscription.charged` webhook events also use the fallback eventId format: `${event.event}_${event.payload?.payment?.entity?.order_id || Date.now()}` at line 37. If `order_id` is missing, falls back to `Date.now()` — potential collision.

### Can concurrent requests create duplicate activations?
**YES** — Two simultaneous `subscription.charged` webhooks could both update the subscription and profile. The second write overwrites the first with the same data (idempotent writes), so the end state is correct. But this relies on luck, not guarantees.

**Risk**: LOW — the writes are idempotent (same values each time). The event's `razorpay_event_id` dedup should prevent this, but the race makes it unreliable.

---

## Workflow 5: Quote Creation

**Files**: `src/app/api/quotes/route.ts:19-53`, `src/lib/supabase/queries.ts:69-141`

### Execution Order
```
1. requireAuth()                                                (line 21)
2. checkQuoteLimit()                                            (line 24)
3. generateQuoteNumber(user.id) → RPC increment_quote_counter   (line 31)
4. INSERT quotes                                                 (line 93-114)
5. INSERT quote_items                                            (line 130-132)
6. If items fail → DELETE quote (compensation)                  (line 135-136)
```

### Can quote count race cause limit bypass?
**YES** 🔴 — Step 3 (`increment_quote_counter` RPC) and the `checkQuoteLimit()` at step 2 are separate operations. Two concurrent requests could both pass the limit check and both create quotes. The counter increments atomically but the limit check is a separate read.

**Scenario**:
```
User has 49 quotes, limit is 50
Request A: checkQuoteLimit → used=49, limit=50 → allowed=true
Request B: checkQuoteLimit → used=49, limit=50 → allowed=true  ← SAME READ
Request A: create quote #50 → succeeds
Request B: create quote #51 → succeeds  ← OVER LIMIT
```

**Impact**: LOW — user goes 1 over limit. Next month resets. Not a payment issue.

---

## Workflow 6: Quote Sending

**Files**: `src/app/api/quotes/send/route.ts:10-87`

### Execution Order
```
1. requireAuth()                                                (line 12)
2. SELECT quote WHERE id = X                                   (line 18-22)
3. Check ownership                                              (line 28-30)
4. Check not already accepted                                   (line 32-34)
5. SELECT profile business_name                                 (line 36-40)
6. Send email (if configured)                                   (line 47-64)
7. If email fails → return 502, quote NOT transitioned          (line 61-63) ← FIXED in P0-004
8. UPDATE quotes SET status = "sent"                            (line 67-70)
9. Fire-and-forget follow-up scheduling                         (line 73-77)
```

### Safe? ✅
Email is sent BEFORE status transition. Failure returns error without changing state. Repeat calls are safe — they send another email but don't corrupt state. The follow-up schedule could be created twice but the scheduling endpoint uses fire-and-forget and the follow-up process checks for duplicates.

---

## Database Guarantees Summary

| Workflow | App Protection | DB Protection | Safe? |
|---|---|---|---|
| Quote creation | Plan gate check, owner-scoped INSERT | UNIQUE(quote_number) | ✅ Safe |
| Quote acceptance | `.eq("status", "sent")` conditional UPDATE, compensation logic | Row-level lock on UPDATE, no UNIQUE(quote_id) on invoices | ✅ Safe (app-level) |
| Invoice creation | Conditional acceptance guard | No UNIQUE(invoice_number) | ⚠️ UNSAFE at DB level |
| **Webhook payment** | **Read-then-write dedup** | **No UNIQUE(razorpay_event_id)** | **🔴 UNSAFE** |
| **Webhook retry** | **No atomicity** | **No transaction** | **🔴 UNSAFE** |
| Payment order creation | Auth + quote accepted check | None | ✅ Safe (by design) |
| Subscription activation | Webhook dedup (broken) | No UNIQUE constraint | ⚠️ UNSAFE |
| Quote sending | Email-first order | None | ✅ Safe (after P0-004) |
| Quote counter | Atomic RPC | Function-level atomicity | ✅ Safe |

---

## Final Verdict

### SAFE FOR 10 CUSTOMERS? **NO**

Two P0 payment integrity issues exist:

1. **CW-001**: Duplicate webhook processing can double-pay invoices. Requires concurrent delivery of the same webhook. Probability at 10 customers: LOW. Impact: HIGH.
2. **CW-002**: Crash between invoice update and event logging causes double-payment on Razorpay retry. Probability: LOW. Impact: HIGH.

### SAFE FOR 100 CUSTOMERS? **NO**

Same issues. Probability increases with volume. At 100 customers with ~10 payments each, the chance of at least one webhook race or crash-between-writes becomes material.

### SAFE FOR 1,000 CUSTOMERS? **NO**

These issues will definitely manifest at this scale.

### Minimum Fix Required Before Launch

| Fix | File | Effort | Impact |
|---|---|---|---|
| 1. Add `UNIQUE` constraint on `webhook_events.razorpay_event_id` | Migration | 10 min | Prevents duplicate event inserts at DB level |
| 2. Reverse webhook processing order: INSERT event FIRST with `ON CONFLICT DO NOTHING`, THEN update invoice | `webhook/razorpay/route.ts` | 1h | Atomic dedup — if event already exists, skip processing |
| 3. Add Sentry alert for duplicate payment detection (paid_amount > amount) | `webhook/razorpay/route.ts` | 30 min | Detect overpayment if it occurs despite fixes |

**Total fix time: ~2 hours.** After these fixes, safe for 1,000+ customers.
