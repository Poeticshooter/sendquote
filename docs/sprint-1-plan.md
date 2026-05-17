# Sprint 1 Implementation Plan

## SQ-1: Add `archived` and `lost` to `quotes.status` CHECK constraint

**Summary:** The DB constraint doesn't allow `archived` or `lost` but code references both. Add them to the constraint.

**Files to touch:**
- `supabase/migrations/022_add_archived_lost_status.sql` (new migration)
- `src/app/dashboard/DashboardShell.tsx` — add toast on bulk status update success/failure
- `src/lib/status-styles.ts` — verify archived/lost styles exist

**Assumptions:**
- Migration 021 is the latest; this will be 022.
- `archived` and `lost` are additive — no existing data needs migration.
- QuoteTable already has styles for both (confirmed in code review).

---

## SQ-2: Fix invoice PDF `unpaid` → `pending` watermark

**Summary:** `pdf.ts` checks `status === "unpaid"` but DB only has `pending`. Fix the check.

**Files to touch:**
- `src/lib/pdf.ts` — change `"unpaid"` → `"pending"` on line ~593

**Assumptions:**
- No other code references `"unpaid"` for invoice status.

---

## SQ-3: Add `invoice_id` column to `cron_reminders` and fix FK constraints

**Summary:** Invoice reminders store invoice UUIDs in `quote_id` column, violating FK. Add separate `invoice_id` column.

**Files to touch:**
- `supabase/migrations/023_cron_reminders_invoice_id.sql` (new migration)
- `src/app/api/cron/route.ts` — use `invoice_id` for invoice reminders, `quote_id` for quote reminders
- Update `batchCheckReminders` and `batchMarkReminders` to handle both types

**Assumptions:**
- Migration 021 has the strict FK; we need to drop and recreate it.
- Existing `cron_reminders` rows only contain quote IDs (safe to keep as-is).

---

## SQ-4: Audit and create all missing RPC functions via migrations

**Summary:** Code references RPCs not in visible migrations. Create DB_CONTRACT.md, add missing RPCs as migrations, create health endpoint.

**Files to touch:**
- `docs/DB_CONTRACT.md` (new) — list all RPCs with signatures
- `supabase/migrations/024_missing_rpc_functions.sql` (new migration)
- `src/app/api/health/rpc/route.ts` (new endpoint) — calls each critical RPC
- Tests as needed

**RPCs to verify/create:**
1. `get_dashboard_stats(p_user_id)` — used by dashboard page
2. `next_quote_number(p_user_id)` — used by quote wizard
3. `create_invoice_from_quote(p_quote_id)` — used by convert-to-invoice API
4. `get_quote_admin(p_id)` — used by send-quote-email API
5. `get_profile_admin(p_user_id)` — used by send-quote-email API
6. `get_quote_items(p_quote_id)` — used by send-quote-email API
7. `record_quote_action(p_token, p_action, p_notes)` — used by send-quote-email API
8. `cleanup_expired_admin_sessions()` — used by cron
9. `purge_soft_deleted_quotes()` — used by cron
10. `downgrade_expired_plans()` — used by cron

**Assumptions:**
- `create_invoice_from_quote` already exists in migration 013 (confirmed).
- Other RPCs need to be created from scratch based on code usage patterns.
- We'll create minimal, correct implementations matching what the code expects.

---

## SQ-5: Fix "Save & Send" — make it actually send email

**Summary:** Step 4 "Save & Send" only sets status=sent, doesn't email. Rename buttons, add confirmation modal, trigger email send.

**Files to touch:**
- `src/components/quote-wizard.tsx` — rename buttons, add confirmation modal, call send-quote-email API
- Potentially a new confirmation modal component (or inline in wizard)

**Assumptions:**
- The existing `ActivityTimeline` component already exists (confirmed at `src/components/activity-timeline.tsx`).
- We'll add a simple inline confirmation modal in the wizard rather than a new component.
- The `/api/send-quote-email` endpoint already handles the full email+PDF flow.

---

## Dark Mode Fix

**Summary:** Dark mode partially works but needs consistency. Current state: inline script in layout.tsx sets `dark` class, CSS variables handle styling, theme-toggle toggles. Issues to fix:
1. Some components may not use `dark:` variants consistently
2. Need to verify no hydration mismatch
3. Ensure system preference respected on first load

**Files to touch:**
- `src/components/theme-toggle.tsx` — improve initialization, reduce flicker
- `src/app/layout.tsx` — verify inline script is correct (already looks good)
- `src/app/globals.css` — verify dark variables are complete
- Scan all components for missing `dark:` variants

**Approach:**
1. The inline script in layout.tsx already handles SSR-safe theme initialization — this is correct.
2. The theme-toggle has a `mounted` state to avoid hydration mismatch — this is correct.
3. Main issue: inconsistent `dark:` classes across components. We'll audit and fix the most critical ones.
4. Add `darkMode: 'class'` to Tailwind config if not already set (Tailwind v4 uses `@import "tailwindcss"` which defaults to class-based dark mode).

**Assumptions:**
- Tailwind v4 with `@import "tailwindcss"` already handles `dark:` variant via class on `<html>`.
- The inline script approach is correct for App Router.
- We'll focus on the dashboard, quote detail, and auth pages for dark mode consistency.
