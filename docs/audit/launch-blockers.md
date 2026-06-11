# Launch-Blocking Issues (P0)

These issues MUST be fixed before any production launch or major release. Each has HIGH or CRITICAL impact and no acceptable workaround.

---

## P0-1: Plan Mismatch on Signup (B-001)

**Issue**: All users create with `plan: "starter"` (50 free AI quotes) instead of `plan: "free"` (5 non-AI quotes). Direct revenue leak.

**Fix**: Change hardcoded `plan: "starter"` to `plan: "free"` in `signup-profile/route.ts:92`. Create DB migration to fix existing users who should be on "free".

**Risk if ignored**: Revenue loss from users bypassing Growth plan. Estimated 30-40% of users who would upgrade at 6-quote mark never hit the limit.

---

## P0-2: CSRF Token Never Issued (D-006)

**Issue**: CSRF verification is active but no code sets the cookie. All non-whitelisted POST/PUT/PATCH/DELETE endpoints return 403.

**Fix**: Implement CSRF token generation in middleware response. Set `__csrf` cookie with a secure random value on first request.

**Risk if ignored**: Core API functionality broken — quote creation, sending, AI generation, CRM sync all fail.

---

## P0-3: Rate Limiting Non-Functional (D-001)

**Issue**: `increment_rate_limit` RPC doesn't exist in any migration. Fallback is per-instance in-memory. In serverless, rate limiting is effectively disabled.

**Fix**: Create the `increment_rate_limit` PostgreSQL function, OR remove the dead code and make the in-memory fallback primary with better isolation.

**Risk if ignored**: API is unprotected against abuse. DoS possible.

---

## P0-4: Follow-up Sequences Never Schedule (B-005)

**Issue**: Query filters for `user_id.is.null` but default sequences use sentinel UUID `'00000000-0000-0000-0000-000000000000'`. Zero matches → zero follow-ups.

**Fix**: Either update the query to `user_id.eq.00000000-...` OR update the migration to use NULL.

**Risk if ignored**: Auto follow-up feature completely non-functional. Users lose a core value proposition.

---

## P0-5: Acceptance Partial Failure (B-004)

**Issue**: Quote acceptance has no transaction wrapping. Invoice creation can fail after status update.

**Fix**: Wrap signature+status+invoice creation in a Supabase RPC transaction, or add compensation logic to revert status+signature on invoice failure.

**Risk if ignored**: Accepted quotes with no invoice = revenue that can't be collected.

---

## P0-6: Quote Sent Before Email Confirmed (B-003)

**Issue**: Quote status transitions to "sent" before email is sent. Email failure leaves quote stuck at "sent".

**Fix**: Send email FIRST, update status only on success.

**Risk if ignored**: Clients not receiving quotes with no seller visibility. Lost deals.

---

## P0-7: Secrets in .env.local (ISS-001)

**Issue**: `.env.local` with 15+ live API keys in repo checkout.

**Fix**: Add to `.gitignore`, rotate all keys, use environment variables in Vercel.

**Risk if ignored**: Complete security compromise of all integrated services.

---

## P0-8: TypeScript Errors Hidden Locally (ISS-008)

**Issue**: `ignoreBuildErrors: true` when not in CI. Type errors ship to production.

**Fix**: Remove the conditional override or set up proper local type checking.

**Risk if ignored**: Latent type bugs in production.

---

## P0-9: No Subscription plan_expiry Set (R-002)

**Issue**: `subscription.charged` webhook updates subscriptions table but never sets `profiles.plan_expiry`.

**Fix**: Add `profiles.plan_expiry` update from `current_period_end` in the webhook handler.

**Risk if ignored**: Paying users never expire. Unpaid access continues indefinitely.

---

## P0-10: Google OAuth Profile Gap (W-001 - UNKNOWN)

**Issue**: Unknown whether `/auth/callback` creates profile rows for Google OAuth signups.

**Fix**: Inspect callback handler. If missing, add profile creation call.

**Risk if ignored**: Google OAuth users cannot use the application.
