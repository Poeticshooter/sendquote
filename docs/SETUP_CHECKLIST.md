# SendQuote — Complete Setup & Launch Checklist

**Last updated:** 2026-06-08
**Build status:** ✅ 62 pages, 0 errors

---

## SECTION 1: DONE — Already Committed (Just Push)

Push to GitHub to activate everything:
```bash
git push origin main
```

This deploys all of the following:

### Infrastructure
- ✅ GitHub Actions CI (lint → typecheck → test → build)
- ✅ Performance budgets (`budget.json`)
- ✅ Lighthouse CI config (`lighthouserc.js`)
- ✅ Bundle analysis (`pnpm analyze`)
- ✅ `shadcn` moved to devDependencies
- ✅ Empty directories cleaned up

### AI Optimization
- ✅ Provider cascade: Groq → OpenRouter (free) → Gemini (free)
- ✅ Semantic cache for AI responses (`ai_cache` table, 24h TTL)
- ✅ Cache-first + fallback chain on `generate-quote.ts` + `followup.ts`
- ✅ No single point of failure on AI

### SEO
- ✅ 4 comparison pages (vs PandaDoc, Proposify, Qwilr, Better Proposals)
- ✅ FAQPage + Product JSON-LD structured data on each
- ✅ Comparison index page with score badges
- ✅ Sitemap updated with all comparison entries
- ✅ `prefers-reduced-motion`, z-index scale, meta tags, Open Graph

### Security
- ✅ Cloudflare Turnstile component + verification API (on signup page)
- ✅ CSP headers, CSRF, rate limiting, bot detection, Sentry on all routes
- ✅ Env var validation at startup (`src/lib/config.ts`)

### Product
- ✅ Annual pricing toggle (Save 20%) on pricing page
- ✅ Onboarding wizard (3-step: profile → sample quote → share)
- ✅ Dynamic imports for recharts (smaller initial bundle)
- ✅ Formbricks in-app surveys provider
- ✅ Performance DB indexes migration (5 composite indexes)
- ✅ 7 new API integration tests + health/security tests

---

## SECTION 2: NEEDED — Free Services to Sign Up (15 min total)

### Step 1: OpenRouter (free AI fallback)
```bash
# 1. Go to https://openrouter.ai/keys
# 2. Sign up with GitHub/Google
# 3. Click "Create Key"
# 4. Copy the key
# 5. Add to .env.local:
echo "OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx" >> .env.local
```
**What it gives you:** Free access to DeepSeek V3, Phi-4, Mistral, and 200+ models. Used as fallback if Groq is down. ~1M free tokens.

### Step 2: Cloudflare Turnstile (free CAPTCHA)
```bash
# 1. Go to https://dash.cloudflare.com/
# 2. Sign up (free tier)
# 3. Go to Turnstile (left sidebar)
# 4. Click "Add Site"
# 5. Site name: "SendQuote"
# 6. Domain: sendquote.in (and localhost for dev)
# 7. Widget type: "Invisible" (non-interactive)
# 8. Copy Site Key and Secret Key
# 9. Add to .env.local:
echo "NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAxxx" >> .env.local
echo "TURNSTILE_SECRET_KEY=0x4AAAAxxx" >> .env.local
```
**What it gives you:** Bot protection on signup. Unlimited free requests. No user friction (invisible).

### Step 3: Formbricks (free in-app surveys)
```bash
# 1. Go to https://formbricks.com/
# 2. Sign up (free tier — 500 people/mo)
# 3. Create a new project "SendQuote"
# 4. Copy Environment ID from Settings → Environment
# 5. Add to .env.local:
echo "NEXT_PUBLIC_FORMBRICKS_ENV_ID=clx..." >> .env.local
```
**What it gives you:** In-app NPS surveys, user feedback forms, product experience tracking.

### Step 4: UptimeRobot (free monitoring)
```bash
# 1. Go to https://uptimerobot.com/
# 2. Sign up (free: 50 monitors, 5min checks)
# 3. Add two monitors:
#    - "SendQuote Homepage" → https://sendquote.in
#    - "SendQuote API" → https://sendquote.in/api/health
# 4. Set alert contact to your email
```
**What it gives you:** SMS/email alerts if your site goes down.

### Step 5: Better Stack (free log monitoring)
```bash
# 1. Go to https://betterstack.com/
# 2. Sign up (free: 1GB log ingestion)
# 3. Create a log source → select "Vercel"
# 4. Follow Vercel integration instructions
# 5. Optionally create a status page: betterstack.com/status-page
```
**What it gives you:** Centralized Vercel logs, uptime monitoring, status page (e.g., status.sendquote.in).

---

## SECTION 3: NEEDED — One-Time Setup Commands

### Step 6: Apply Database Migrations
```bash
# Apply AI cache table + performance indexes
pnpm supabase db push

# Verify migrations applied
pnpm supabase db list
```

### Step 7: Fix Pricing Tier Limit Mismatch
The FOUNDERS_REFERENCE flagged that pricing page says "5 quotes/month" but code enforces a different limit.
- Open `src/app/(marketing)/pricing/page.tsx`
- Find the tiers definition
- Ensure the free tier says "5 quotes/month"
- Ensure starter says "50 quotes/month"
- Verify these match `src/lib/plan-gates.ts`

### Step 8: Verify Google OAuth State
The OAuth `state` parameter protection was added in an earlier session.
- Test: login with Google → should redirect to callback → back to dashboard
- If it fails, check `src/app/auth/callback/route.ts` for the state verification logic

### Step 9: Run Tests Before Deploy
```bash
pnpm test        # 93 tests — should pass
pnpm typecheck   # 0 errors
pnpm build       # 62 pages, 0 errors
```

---

## SECTION 4: OPTIONAL — Nice to Haves (Build When You Have Time)

| Item | Effort | Impact | Guide |
|---|---|---|---|
| **OpenAPI spec** | 4 hrs | Unlocks API docs + Zapier | Use `@/lib/api-validation.ts` schemas as source |
| **PDF export** | 6 hrs | Required by enterprise | `@react-pdf/renderer` (free OSS) |
| **Stripe** | 4 hrs | Global payments (beyond India) | Stripe SDK (free to integrate) |
| **Public API keys** | 2 hrs | Developer adoption | Generate API keys from dashboard |
| **Mobile app (Expo)** | 2-4 weeks | Biggest missing feature | React Native + Expo (free OSS) |
| **Zapier integration** | 4 hrs | Enterprise requirement | Zapier CLI (free, publish after review) |
| **Blog content (10 articles)** | 8 hrs | Long-term SEO traffic | Target "quoting software India" keywords |

---

## SECTION 5: MONTHLY MAINTENANCE (15 min/week)

```bash
# Week 1: Check Sentry for new errors
open https://sentry.io

# Week 2: Review PostHog analytics
open https://posthog.com

# Week 3: Run dependency audit
pnpm audit --severity high

# Week 4: Run Lighthouse audit
pnpm dlx lighthouse https://sendquote.in --output=html
```

---

## SECTION 6: FREE TIER LIMITS — What to Watch

| Service | Limit | When to Upgrade |
|---|---|---|
| **Vercel** | 100h serverless/mo, 100GB bandwidth | >50 active users |
| **Supabase** | 500MB DB, 50K users, 2M edge funcs | >100K monthly requests |
| **Groq** | 14,400 req/day | >14K AI generations/day |
| **Resend** | 100 emails/day | >100 quotes sent/day |
| **Sentry** | 5K events/month | >5K errors/month |
| **PostHog** | 1M events/month | >1M tracked events/month |
| **UptimeRobot** | 50 monitors, 5min intervals | Always free |
| **Cloudflare Turnstile** | Unlimited | Always free |
| **OpenRouter** | Free models + free credits | Always free for free models |
| **Formbricks** | 500 responses/mo | >500 survey responses/mo |

---

## QUICK DEPLOY CHECKLIST

```markdown
Before launching:
- [ ] `git push origin main` — CI runs automatically
- [ ] All 4 free services signed up (Turnstile, OpenRouter, Formbricks, UptimeRobot)
- [ ] `supabase db push` — AI cache + indexes applied
- [ ] `.env.local` has all 4 new keys
- [ ] `pnpm test` — 93 tests pass
- [ ] `pnpm build` — 62 pages, 0 errors
- [ ] Test signup flow (email + Google)
- [ ] Test quote creation → send → accept flow
- [ ] Test annual pricing toggle on /pricing
- [ ] Test onboarding wizard on /onboarding
```
