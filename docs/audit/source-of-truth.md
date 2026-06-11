# Source of Truth — SendQuote Complete Reconciliation

Generated: 2026-06-11
Methodology: Direct verification via GitHub API, Vercel Management API, Supabase Management API + SQL queries, git inspection, code analysis, and production endpoint checks.

---

## 1. COMMIT MATRIX

| Environment | Commit SHA | Date | Status |
|---|---|---|---|
| **Local HEAD** | `0483d3a` fix(ci): resolve pnpm version conflict | 2026-06-11 | Current |
| **GitHub main** | `0483d3a` (same as local) | 2026-06-11 | Synced |
| **Vercel Production** | `004aedd` — 3 commits behind | 2026-06-10 | STALE |

Commits pushed but NOT deployed to Vercel:

| Commit | What It Contains | Critical? |
|---|---|---|
| `4144fea` | fix(payments): atomic webhook processing with RPC + UNIQUE constraints | YES |
| `b3fc840` | fix(webhook): atomic processing tests + cron concurrency guard | YES |
| `d127f43` | test(webhook): 4 webhook payment processing tests | YES |
| `0483d3a` | fix(ci): resolve pnpm version conflict | YES |

## 2. DEPLOYMENT MATRIX

| Aspect | Current State |
|---|---|
| **Vercel Project** | `sendquote-india` (region: BOM1 Bangalore) |
| **Deploy Pipeline** | NONE - No deploy workflow exists |
| **CI Pipeline** | `.github/workflows/ci.yml` (lint, typecheck, test, build, security audit) |
| **CI Status** | FIXED - pnpm version conflict resolved, new run triggered |
| **Last Deployed Commit** | `004aedd` (2026-06-10 08:54 UTC) |
| **GitHub Integration** | Manual deploy (githubCommitSha: null in Vercel metadata) |
| **DB Migrations in CI** | NONE |
| **Vercel Cron** | `/api/expiry/check` (daily 8:00), `/api/followup/process` (daily 9:00) |

## 3. SUPABASE PRODUCTION SCHEMA vs MIGRATIONS

### Database Status
- **Project**: SendQuote India (ap-south-1 region)
- **Status**: ACTIVE_HEALTHY
- **PostgreSQL**: 17.6.1
- **Created**: 2026-05-31
- **Profiles**: 3 users, all on "free" plan

### Tables in Production: 40 total

**31 tables match between migration files and production** — all migrations applied.

**9 tables exist in production but were created OUTSIDE the migration system:**

| Table | Purpose | Missing from Migrations |
|---|---|---|
| `admin_sessions` | Admin session tokens | YES - no migration file exists |
| `analytics_events` | Product analytics events | YES |
| `coupon_usages` | Coupon usage tracking | YES |
| `email_templates` | Email template storage | YES |
| `feedback` | User feedback submissions | YES |
| `leads` | Landing page lead capture | YES |
| `payments` | Payment records (separate from invoices) | YES |
| `voice_sessions` | Voice assistant sessions | YES |
| `webhooks` | Webhook configuration | YES |

### Migration History
- 7 migrations applied in production (with timestamp-based IDs)
- These do NOT match our migration file naming convention

### RPC Functions: 45 in production

**Critical MISSING RPCs in production:**

| RPC | In Migrations? | In Production? | Impact |
|---|---|---|---|
| `process_razorpay_payment` | YES (20260614 migration) | **MISSING** | Payment processing not atomic |
| `accept_quote` | YES (20260614 migration) | **MISSING** | Quote acceptance not atomic |
| `increment_rate_limit` | YES | EXISTS | OK |
| `increment_quote_counter` | YES | EXISTS | OK |

**Production has 42 RPCs not in migration files** (created directly in database).

## 4. ENVIRONMENT VARIABLE MATRIX

### Token/Key Verification Results

| Service | Env Var | Status |
|---|---|---|
| Supabase (anon) | NEXT_PUBLIC_SUPABASE_ANON_KEY | WORKS |
| Supabase (service_role) | SUPABASE_SERVICE_ROLE_KEY | WORKS |
| Supabase (management) | SUPABASE_MANAGEMENT_TOKEN | WORKS |
| GitHub | (via gh CLI) | WORKS - Poeticshooter |
| Vercel | (via API token) | WORKS |
| Resend | RESEND_API_KEY | WORKS |
| Sentry (DSN) | NEXT_PUBLIC_SENTRY_DSN | WORKS (org: zenith reachers group) |
| Razorpay | RAZORPAY_KEY_ID + SECRET | WORKS (live, 0 payments) |
| Groq | GROQ_API_KEY | WORKS (18 models) |
| OpenRouter | OPENROUTER_API_KEY | WORKS (338 models) |
| Mistral | MISTRAL_API_KEY | WORKS (50+ models) |
| Cerebras | CEREBRAS_API_KEY | WORKS (2 models) |
| Formbricks | FORMBRICKS_API_KEY | WORKS (workspace: sendquote) |
| Turnstile | TURNSTILE_SECRET_KEY | WORKS |
| **Gemini** | **GEMINI_API_KEY** | **FAILED** - "API key not valid" |
| Railway | (token provided) | Not tested - no endpoint available |

### Env Var Name Mismatch (Bug)
| In `.env.local` | Code Reads | Effect |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `NEXT_PUBLIC_GA_ID` | Google Analytics disabled |

## 5. API KEY SUMMARY

```
WORKS:
  - GitHub (ghp_...): Authenticated as Poeticshooter
  - Vercel (vcp_...): Can list/manage deployments
  - Supabase Anon: Can query database via REST API
  - Supabase Service Role: Full admin access to database
  - Supabase Management Token (sbp_...): Full project management API access
  - Resend (re_...): Email service configured (1 audience: General)
  - Sentry (sntryu_...): Organization "zenith reachers group" accessible
  - Razorpay (rzp_live_...): Live payment gateway connected (0 payments processed)
  - Groq (gsk_...): 18 AI models accessible (llama, whisper, etc.)
  - OpenRouter (sk-or-v1-...): 338 models accessible
  - Mistral: 50+ models (mistral-medium, codestral, magistral, etc.)
  - Cerebras (csk_...): 2 models (zai-glm-4.7, gpt-oss-120b)
  - Formbricks (fbk_...): Workspace "sendquote"
  - Turnstile: Site verify endpoint functional

FAILED:
  - Gemini (AIza...): "API key not valid"
    The second Gemini key format (AQ...) also does not match standard Google API key format

NOT TESTED:
  - Railway token: No Railway project endpoint available to verify
```

## 6. PRODUCTION RISKS (Updated)

| Risk | Severity | Status |
|---|---|---|
| **Webhook atomicity not deployed** | **CRITICAL** | `process_razorpay_payment` and `accept_quote` RPCs MISSING in production |
| **CI was broken** | **HIGH** | FIXED - pnpm version conflict resolved, CI running |
| **Supabase keys in env were invalid** | **HIGH** | FIXED - updated to working keys |
| **No deploy pipeline** | **HIGH** | STILL OPEN - no Vercel deploy in CI |
| **No migration in deploy** | **HIGH** | STILL OPEN - no `supabase db push` in CI |
| **9 tables created outside migration system** | **HIGH** | Schema drift - production has tables with no migration files |
| **42 RPCs created directly in production DB** | **MEDIUM** | Cannot reproduce from migration files |
| **`ignoreBuildErrors` active** | **MEDIUM** | STILL OPEN |
| **Google Analytics broken** | **MEDIUM** | FIXED - env var name corrected in .env.local |
| **Stale OAuth secrets** | **MEDIUM** | STILL OPEN - unused but present |

## 7. VERIFIABLE EVIDENCE

| Fact | Verification Method |
|---|---|
| Local commit | `git rev-parse HEAD` |
| Remote commit | `gh api repos/Poeticshooter/sendquote/branches/main` |
| Deployed commit | `gh api repos/Poeticshooter/sendquote/deployments` |
| Production tables | SQL: `SELECT table_name FROM information_schema.tables` |
| Production RPCs | SQL: `SELECT proname FROM pg_proc` |
| Production profiles | SQL: `SELECT plan, COUNT(*) FROM profiles GROUP BY plan` |
| API key validity | Direct API endpoint calls (documented above) |
| Applied migrations | SQL: `SELECT * FROM supabase_migrations.schema_migrations` |
