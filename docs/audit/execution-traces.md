# Execution Traces — Critical Paths

## Trace 1: Signup → Profile Creation → Plan Assignment

```
User clicks "Create Account"
→ signup/page.tsx handleSignup()
→ supabase.auth.signUp({email, password})         // Creates auth.users
→ fetch("/api/auth/signup-profile", {userId, businessName, email})
  → signup-profile/route.ts POST
    → supabase.auth.getUser()                      // Verifies session
    → admin.from("profiles").upsert({
        plan: "starter",                           // ← BUG: should be "free"
        billing_cycle: "monthly",
        subscription_status: "inactive"
      })
    → Profile created with 50 free AI quotes
→ router.push("/onboarding")                       // If auto-confirmed
→ User never hits limit → never upgrades
```

## Trace 2: Quote Creation → Counter Divergence

```
User fills out new quote form
→ new/page.tsx handleSubmit()
→ POST /api/quotes
  → requireAuth()
  → checkQuoteLimit()                              // Plan gate check
  → generateQuoteNumber(user.id)                   // ← Counter INCREMENTED HERE
    → rpc("increment_quote_counter", {user_id})
    → profiles.quote_counter += 1                  // COMMITTED
  → CreateQuoteSchema.parse(body)                  // Validation — CAN FAIL
  → createQuote({...})                             // Quote INSERT — CAN FAIL
    → quotes.insert({...})                         // If FAILS here:
    → quote_items.insert({...})                    // Counter already incremented
    → If items fail: quotes.delete() rollback      // Counter still incremented
  → Return quote
```

## Trace 3: Send Quote → Status Before Email

```
User clicks "Send"
→ quotes/[id]/page.tsx handleSend()
→ POST /api/quotes/send
  → requireAuth()
  → quotes.update({status: "sent", sent_at: now})  // ← COMMITTED FIRST
  → fetch profiles.business_name
  → sendEmail()                                     // ← CAN FAIL AFTER STATUS SET
    → If RESEND_API_KEY missing: logs "Not configured"
    → If API error: logs error, returns failure
  → fetch("/api/followup/schedule")                 // Fire-and-forget
    → .catch(console.error)                        // Failures silently swallowed
  → Return success
```

## Trace 4: Quote Acceptance → Partial Failure

```
Client signs and accepts
→ public-quote-view.tsx → AcceptQuoteFlow
→ POST /api/quotes/accept
  → AcceptQuoteSchema.parse(body)
  → quotes.select("*").eq("public_token", token)    // Find quote
  → quote_signatures.insert({...})                  // Step 1: ✅ COMMITTED
  → quotes.update({status: "accepted"})             // Step 2: ✅ COMMITTED
    .eq("id", quote.id).eq("status", "sent")        // Race condition guard
  → invoices.insert({...})                          // Step 3: ⚠️ CAN FAIL
    → If fails: Steps 1-2 NOT ROLLED BACK
    → Quote stuck at "accepted" with NO invoice
  → quote_events.insert({...})                      // Step 4: Fire-and-forget
  → syncQuoteToCrm().catch(...)                     // Step 5: Fire-and-forget
```

## Trace 5: Follow-up Scheduling → Zero Matches

```
Quote sent
→ POST /api/followup/schedule
  → requireAuth()
  → quotes.select().eq("id", quote_id).eq("user_id", user.id)
  → followup_sequences.select("*")
    .eq("is_active", true)
    .or(`user_id.eq.${user.id},user_id.is.null`)    // ← BUG HERE
    → Default sequences have user_id = '00000000-...' (NOT NULL)
    → Supabase SQL IS NULL checks for actual NULL, not sentinel UUID
    → Result: 0 sequences matched
  → schedules = [] → return {scheduled: 0}
  → No follow-ups ever created
```

## Trace 6: Rate Limiting → No-op DB Call → In-Memory Fallback

```
Every API request
→ middleware.ts or individual API route
→ rateLimitCheck(request)
  → rpc("increment_rate_limit", {                  // ← RPC DOES NOT EXIST
      p_key, p_max_requests, p_window_ms
    })
  → Error: function "increment_rate_limit" not found
  → catch block → checkMemoryRateLimit(key, ...)   // Fallback
    → In-memory Map per serverless instance
    → Each cold start = fresh Map
    → Rate limiting effectively disabled
```

## Trace 7: CSRF Verification → Always Fails

```
Any POST/PUT/PATCH/DELETE (non-whitelisted)
→ middleware.ts
  → verifyCsrfToken(request)
    → cookieToken = cookies.get("__csrf")?.value    // Cookie doesn't exist
    → headerToken = headers.get("x-csrf-token")      // Not sent by client
    → Returns {ok: false, status: 403}
  → Returns 403 "CSRF token missing"
→ All state-changing operations fail
```

## Trace 8: Subscription Charged → plan_expiry Never Written

```
Razorpay sends subscription.charged webhook
→ POST /api/webhook/razorpay
  → HMAC verification
  → case "subscription.charged"
    → subscriptions.update({
        status: "active",
        current_period_end: ...                     // Updated here
      })
    → profiles.plan_expiry                         // ← NEVER UPDATED
    → Profile.plan_expiry remains null/unchanged
```
