# SendQuote Founder's Reference

**Last updated:** 2026-06-08 (evening — comprehensive UI/UX audit, code quality fixes, plan gates wired, Sentry added to all API routes)

Not a prompt. Not an AI spec. A living reference of what matters, what doesn't, and what to do when. Read it before deploying. Update it when you learn something.

---

## 1. The Security Baseline (Non-Negotiable)

These are the lines you do not cross. Every deploy must pass every check.

### Production Keys
- `.env.local` is on disk. Anyone with terminal access or a compromised npm dep can read it.
- The `SUPABASE_SERVICE_ROLE_KEY` is full database admin. It bypasses RLS entirely. It must never appear in client code, never be logged, and never leave Vercel's runtime.
- You run 4 unauthenticated API routes that use the admin client: `/api/events`, `/api/portal`, `/api/followup/process`, `/api/expiry/check`. Each is a potential data breach.

**Rule:** Every API route either has `requireAuth()` or an explicit justification for being public. Every use of `createAdminClient()` has a comment saying why RLS won't work.

### Email Confirmation
`supabase/config.toml:22` has `enable_autoconfirm = true`. This means anyone can sign up with `admin@example.com`. Until this is `false`, your user database is meaningless.

**Fix:** Change to `enable_confirmations = true, enable_autoconfirm = false`. Then handle the unconfirmed state in your login flow (show a "check your email" screen, not a raw error).

### Cron Endpoints ✅ FIXED
`/api/expiry/check` and `/api/followup/process` are now protected with `verifyCronSecret()` from `src/lib/security/cron.ts`. Fixed — both routes verify `Authorization: Bearer <secret>` using `timingSafeEqual`.

### OAuth State Parameter
`src/app/auth/callback/route.ts` exchanges the OAuth code for a session without checking the `state` parameter. This means an attacker can craft a login link, intercept the callback, and bind your session to their account.

**Fix:** Generate a random `state` on the login page, store it in a short-lived cookie, and verify it in the callback handler.

### Database Schema in Version Control
Only one migration file exists. The core tables (`quotes`, `invoices`, `profiles`, `clients`, etc.) are only in production. If something goes wrong, there is no recovery path.

**Fix:** Run `supabase db dump` and commit the full schema as a migration. Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` and verify every table has RLS.

### The Jarvis Bot (startup-os/)
- `config.py` has hardcoded API keys as fallback defaults (`os.environ.get("VAR", "LIVE_KEY")`). Change every one to `os.environ["VAR"]` so it crashes on missing env vars instead of silently working with secrets in source.
- `bizops.py` duplicates credentials from `config.py`. Remove the duplicates, import from config.
- The bot processes every incoming message without checking `chat_id`. Anyone who discovers the bot can interact with it. Add a check at the top of `process()`: `if cid != TELEGRAM_CHAT_ID: return`.
- There are 4 `except: pass` clauses. Replace every one with a specific exception type and a log statement.

---

## 2. The Product Gaps That Lose Customers

### No Onboarding Flow
Signup drops you at `/dashboard` with `No quotes yet`. A new user has no idea what step 1 is. This is the highest-ROI change you can make.

**Build (4 hours, not 4 weeks):**
- A 3-step wizard: Business Profile → Sample Quote → Share
- Mark `onboarding_completed = true` in the profile
- After completion, redirect to `/dashboard` with a "Congrats, here's your sample quote" state
- That's it. No multi-week design system. No perfect animations. Just the steps.

### Portal Shows $ Instead of ₹
`src/app/(dashboard)/portal/page.tsx:103` hardcodes `$`. India pricing needs `₹`. Also on line 125.

**Fix:** Create `src/lib/currency.ts`:
```ts
export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}
```
Replace `$${n}` with `{formatINR(n)}`.

### Dashboard Goes White on API Error
`src/app/(dashboard)/page.tsx:65` — `if (!data) return null`. If the Supabase query fails, the user sees a blank page. No error, no retry.

**Fix:** Replace with:
```tsx
if (error) return <ErrorState message={error.message} onRetry={mutate} />;
```

### Pricing Page Says "5 Quotes/Month" But Code Enforces 50
`src/app/(dashboard)/page.tsx:43` sets starter limit to 50. Pricing page says 5. If a user hits 5 and can still create quotes, they'll never upgrade. Pick one value and make it the source of truth everywhere.

---

## 3. Free-Tier Realities (Not Enterprise BS)

You're on a 4GB MacBook Air 2015 with free-tier services. Every recommendation below is chosen to fit.

### Rate Limiting ✅ REFACTORED
The in-memory fallback is now consolidated into a shared `src/lib/rate-limit.ts` with `checkMemoryRateLimit()`. The `setInterval` cleanup was removed (doesn't work in serverless). Three private Map implementations merged into one.

### Analytics
You have Vercel Analytics (free) + PostHog (free tier, generous) + possibly GA4. Three providers is bloat. Pick one for product decisions (PostHog) and one for performance (Vercel Analytics is already zero-effort). Remove the third.

### Monitoring ✅ DONE
Sentry is on the free tier (5k events/month). `Sentry.captureException` is now called across ALL API route catch blocks — quotes, analytics, events, followup, expiry, portal, webhooks, and more.

### Infrastructure
- No Docker in production. Vercel handles it.
- No Kubernetes. You have 1 app and a Telegram bot.
- No CDN config beyond what Vercel gives you.
- No staging environment. Use Supabase branching when you need it.

The Jarvis bot runs on Railway free tier. It has zero external dependencies (all stdlib Python). This is a genuine achievement — preserve it.

---

## 4. What You Already Have Right

These are the parts a Stripe engineer would nod at. Do not touch them.

| Thing | Why It's Right | File |
|------|----------------|------|
| CSP headers | `'unsafe-inline'` is required by Next.js but everything else is tight | `next.config.ts` |
| Security headers | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| Razorpay webhook | HMAC-SHA256 with `timingSafeEqual` + dedup via `webhook_events` table | `api/webhook/razorpay/route.ts` |
| CSRF protection | Double-submit cookie with origin verification | `middleware.ts`, `csrf.ts` |
| Zod validation | Consistent schema validation in most API routes | `lib/api-validation.ts` |
| Empty states | Every dashboard page handles "no data" with CTA | Multiple dashboard pages |
| Skeleton loading | Dashboard, quotes, clients all show skeleton loaders | Multiple files |
| SEO | Full schema.org (Organization, SoftwareApplication, FAQPage), sitemap, robots.txt, OG tags | `layout.tsx`, `sitemap.ts` |
| Component org | Clean separation: `shared/`, `ui/`, `landing/`, `quotes/`, `deal-room/` | `src/components/` |
| Bot architecture | Zero external deps, SQLite persistence, modular lib/ | `startup-os/` |

---

## 5. The Never Again Checklist

Copy this into your CI or at least print it next to your desk.

### Before Every Deploy
1. No API keys or secrets in the diff. Run `pnpm dlx secretlint`.
2. No `return null` on error paths. Every error has a user-facing state.
3. No `createAdminClient()` usage without a comment explaining why RLS is insufficient.
4. `pnpm typecheck` passes.
5. `pnpm test` passes.
6. `pnpm build` succeeds.

### After Adding a New API Route
1. Zod schema on the input.
2. `requireAuth()` or explicit public designation in middleware.ts.
3. Sentry `captureException` on failures.
4. Rate limit tier assigned.

### Weekly
1. Review Sentry for new errors (5 minutes).
2. Check `SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'` — any suspicious signups?
3. Run `pnpm audit`.

### When Something Breaks in Production
1. Fix the root cause, not the symptom.
2. Add a regression test that would have caught it.
3. Update this document with the lesson.

---

## 6. The Cold Start Problem (How You Get First Paying Customers)

You asked: "How do I get first 10 customers?" Here's the honest answer.

### The Product Hunt Tactic
Solo founders get 70% of their first 100 users from Product Hunt or equivalent. It's the highest-leverage distribution channel for a B2B tool at your stage.

**Do:**
- Schedule a Tuesday launch (highest traffic)
- Prepare 3 screenshots + 1 GIF of the actual product
- Write a first comment telling your story (not selling the product)
- Respond to every comment within 15 minutes
- Price page should be visible BEFORE launch (you have this)

**Don't:**
- Don't launch without fixing the $/₹ bug (Indians will notice)
- Don't launch without onboarding (people will sign up, bounce, never return)
- Don't launch without email confirmation enabled
- Don't optimize for PH upvotes instead of signup conversion

### The Pricing Question
You're pre-revenue. Free tier should be generous enough to be useful, restricted enough to create upgrade pressure.

- Starter: 5 quotes/month, basic templates, email delivery. Enough to try.
- Pro: ₹499/mo — unlimited quotes, client portal, analytics. This is your core product.
- Enterprise: ₹1999/mo — API access, white-label, priority support.

At 10 customers on Pro, you're at ₹4,990/mo. That covers your Vercel and Supabase bills. The math works.

### What Stops a Competitor Copying You
Not much, and acknowledge that. Your moat is:
- **Distribution:** You ship. Most people don't. Every week you're live is a week they're not.
- **Speed:** You iterate fast. By the time someone copies feature X, you've shipped Y and Z.
- **India-specific:** GST support, Indian mobile validation, Razorpay, Hindi-english mix. Global tools don't do this well.

There is no technological moat at this stage. Don't pretend there is. Focus on customers and speed.

---

## 7. When to Ignore This Document

- **When there's a fire** (payment outage, data issue, major bug). Fix first, reference later.
- **When a customer asks for something.** Ship it, then update the checklist.
- **When you're building something that doesn't exist yet.** The first version should be ugly. Make it work, then make it right.

This document exists to prevent you from making the same mistake twice. Not to slow you down.

---

## Quick Reference: Fix Priorities

| What | Why | Time | Status |
|------|-----|------|--------|
| Add CRON_SECRET check | Anyone can trigger expiry/followup | 15 min | ✅ Done |
| Add Sentry to all API routes | Silent errors in production | 30 min | ✅ Done |
| Wire plan gates to quote creation | Free users bypass limits | 10 min | ✅ Done |
| Fix Razorpay balance_due | Overcharging partial payments | 15 min | ✅ Done |
| Atomic quote number generation | Duplicate quote numbers | 30 min | ✅ Done |
| UI/UX contrast audit | Illegible text (1.47:1) | 2 hr | ✅ Done |
| prefers-reduced-motion | WCAG violation | 15 min | ✅ Done |
| z-index scale | Stacking context chaos | 10 min | ✅ Done |
| Rotate API keys | 12 prod keys on disk, breach risk | 15 min | Free |
| Enable email confirmation | Spam signups, useless metrics | 5 min | Free |
| Fix auth callback state | OAuth CSRF vulnerability | 10 min | Free |
| Commit full DB schema | Only living backup is prod DB | 2 hr | Free |
| Remove hardcoded Jarvis secrets | Secrets in source code | 15 min | Free |
| Add Jarvis chat_id check | Anyone can talk to your bot | 5 min | Free |
| Fix $/₹ portal | Indian users see wrong currency | 5 min | Free |
| Build onboarding | Users bounce without guidance | 4 hr | Free |

Everything is free. The only cost is time. Prioritize in this order.
