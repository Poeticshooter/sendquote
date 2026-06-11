# Prioritized Execution Plan

Ranked by: Revenue Risk > Data Loss Risk > Security Risk > Operational Risk > Technical Debt

---

## TIER 1 — FIX IMMEDIATELY (Revenue & Data Loss)

### 1. Push and Deploy 3 Uncommitted Webhook Commits
**Risk**: Revenue Loss, Data Loss  
**Files**: `4144fea`, `b3fc840`, `d127f43` (3 unpushed local commits)
**What**: The atomic webhook processing RPC, UNIQUE constraints on webhook_events/invoices, and `accept_quote` RPC with FOR UPDATE locking exist locally but are NOT in production.
**Evidence**: Production commit `004aedd` vs local `d127f43` — 3 commits gap.
**Action**: Push to origin/main, deploy to Vercel.

### 2. Fix CI Pipeline (pnpm Version Conflict)
**Risk**: Operational  
**Files**: `.github/workflows/ci.yml:12`, `package.json:5`
**What**: CI workflow has `version: latest` but `package.json` has `packageManager: "pnpm@10.9.0"`. All CI runs fail.
**Action**: Change CI workflow to `version: "10.9.0"` OR remove `packageManager` from `package.json`.

### 3. Resolve Supabase API Key Failure
**Risk**: Revenue Loss, Data Loss, Security  
**What**: Both `anon` and `service_role` keys in `.env.local` return "Invalid API key". Production health endpoint confirms DB is reachable, but local env keys are dead.
**Action**: 
- Rotate API keys in Supabase dashboard
- Update `.env.local` with new keys
- Verify `supabase db dump --linked` works
- Dump production schema and commit to migrations

### 4. Fix Google Analytics Env Var Name
**Risk**: Revenue (blindness to user behavior)  
**Files**: `.env.local` has `NEXT_PUBLIC_GA_MEASUREMENT_ID`, code reads `NEXT_PUBLIC_GA_ID`
**Action**: Rename env var to match code expectation.

---

## TIER 2 — FIX THIS SPRINT (Security & Integrity)

### 5. Remove `ignoreBuildErrors` from next.config.ts
**Risk**: Operational  
**File**: `next.config.ts:29`
**What**: `ignoreBuildErrors: process.env.CI === "true" ? false : true` lets TypeScript errors ship to production.
**Action**: Set to `false` unconditionally. Fix any pre-existing TypeScript errors.

### 6. Add Deploy Pipeline to CI
**Risk**: Operational  
**File**: `.github/workflows/ci.yml`
**What**: No automated deploy step exists. All deploys are manual.
**Action**: Add Vercel deploy step after CI passes.

### 7. Add DB Migration Step to Deploy Pipeline
**Risk**: Data Loss  
**What**: No `supabase db push` or migration step in any pipeline.
**Action**: Add `supabase db push` to deploy workflow (requires working API key first).

### 8. Fix `/api/settings/crm` Broken Route
**Risk**: Operational  
**Files**: `components/settings/crm-settings.tsx:20` calls `/api/settings/crm` but route doesn't exist.
**Action**: Create the missing API route or remove the fetch call.

### 9. Remove Stale Env Vars
**Risk**: Security  
**Files**: `.env.local`
**What**: `GOOGLE_CLIENT_SECRET`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `FORMBRICKS_API_KEY` — unused secrets in env file.
**Action**: Remove unused vars. Rotate any that were previously active.

---

## TIER 3 — FIX THIS MONTH (Quality & Maintainability)

### 10. Remove Unused Dependencies
`resend`, `@vitejs/plugin-react`

### 11. Remove or Wire Up Dead Components
`ActivityTimeline`, `AIChatInterface`, `NotificationCenter`, 18 unused shadcn/ui primitives

### 12. Clean Up Unused Database Tables
`coupons`, `user_flag_overrides`, `activity_logs`, `feature_flags`, `invoice_items`, `organization_members` — tables with zero code references.

### 13. Add Missing Foreign Keys
6 tables (quotes, clients, invoices, subscriptions, approval_rules, team_members) missing FK constraints from `user_id` to `profiles.user_id`.

### 14. Update `.env.local.example`
Add 13 missing variables documented in code but absent from the template.

### 15. Add Git Tags / Release Process
Zero tags exist. No versioning.

---

## TIER 4 — BACKLOG (Technical Debt)

- Investigate and reconcile production-only tables (leads, payments, achievements, etc.)
- Add UNIQUE constraint on `quotes.public_token` (only INDEX exists)
- Plan gate enforcement on AI endpoints
- Buyer event tracking for public quote views
- Acceptance/welcome email notifications
- P0/P1 audit issues from previous reports (after verifying current state)

---

## Execution Order Summary

```
NOW:        Push 3 commits → Fix CI → Fix Supabase keys → Fix GA var
THIS WEEK:  Fix ignoreBuildErrors → Add deploy pipeline → Add DB migration → Fix CRM route → Remove stale secrets
THIS MONTH: Remove dead code → Clean DB → Add FKs → Update docs → Add versioning
BACKLOG:    Remaining audit items
```
