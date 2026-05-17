# DB Contract — Supabase RPC Functions

This document lists all RPC functions used by the SendQuote codebase, their signatures, expected behavior, and which code paths depend on them.

## RPC Functions

### 1. `get_dashboard_stats(p_user_id UUID)`
- **Returns:** `TABLE(total_quotes BIGINT, total_value NUMERIC, accepted BIGINT, outstanding NUMERIC, overdue BIGINT, month_count INTEGER)`
- **Used by:** `src/app/dashboard/page.tsx`
- **Behavior:** Returns aggregate stats for a user's quotes: total count, total value, accepted count, outstanding value (sent+opened), overdue count (sent with valid_until < now), and monthly quote count.

### 2. `next_quote_number(p_user_id UUID)`
- **Returns:** `TEXT`
- **Used by:** `src/components/quote-wizard.tsx`, `src/app/dashboard/DashboardShell.tsx`
- **Behavior:** Generates the next sequential quote number for a user (e.g., `QS-0001`, `QS-0002`). Increments an internal counter.

### 3. `create_invoice_from_quote(p_quote_id UUID)`
- **Returns:** `UUID` (the new invoice ID)
- **Used by:** `src/app/api/convert-to-invoice/route.ts`
- **Behavior:** Creates an invoice from an accepted quote, copies line items, increments invoice counter, updates quote status to `accepted`.
- **Defined in:** Migration 013

### 4. `get_quote_admin(p_id UUID)`
- **Returns:** `SETOF quotes` (or a single quote record)
- **Used by:** `src/app/api/send-quote-email/route.ts`
- **Behavior:** Returns a quote by ID, bypassing RLS (admin access). Used to fetch full quote data for email generation.

### 5. `get_profile_admin(p_user_id UUID)`
- **Returns:** `SETOF profiles` (or a single profile record)
- **Used by:** `src/app/api/send-quote-email/route.ts`
- **Behavior:** Returns a user's profile by user_id, bypassing RLS. Used to fetch business name, logo, SMTP settings.

### 6. `get_quote_items(p_quote_id UUID)`
- **Returns:** `SETOF quote_items` (or JSON array)
- **Used by:** `src/app/api/send-quote-email/route.ts`
- **Behavior:** Returns line items for a quote, ordered by sort_order.

### 7. `record_quote_action(p_token TEXT, p_action TEXT, p_notes TEXT)`
- **Returns:** `VOID` or `BOOLEAN`
- **Used by:** `src/app/api/send-quote-email/route.ts`
- **Behavior:** Records a quote action (e.g., 'sent') in quote_events table using the public token.

### 8. `cleanup_expired_admin_sessions()`
- **Returns:** `VOID`
- **Used by:** `src/app/api/cron/route.ts`
- **Behavior:** Deletes admin_sessions where expires_at < NOW().

### 9. `purge_soft_deleted_quotes()`
- **Returns:** `VOID`
- **Used by:** `src/app/api/cron/route.ts`
- **Behavior:** Hard-deletes quotes where is_deleted = true AND deleted_at < NOW() - INTERVAL '24 hours'.

### 10. `downgrade_expired_plans()`
- **Returns:** `VOID`
- **Used by:** `src/app/api/cron/route.ts`
- **Behavior:** Downgrades profiles where plan_expiry < NOW() and plan != 'free' back to 'free' plan.

## Already Defined in Migrations

| RPC | Migration |
|---|---|
| `update_updated_at()` | 000 |
| `handle_new_user()` | 000 |
| `increment_monthly_quote_count()` | 000 |
| `check_rate_limit()` | 000 |
| `soft_delete_quote()` | 000 |
| `deduplicate_quote_events()` | 000 |
| `validate_coupon()` | 000 |
| `increment_coupon_usage()` | 000 |
| `check_subscription_expiry()` | 000 |
| `create_invoice_from_quote()` | 013 |
| `calc_invoice_balance()` | 013 |

## Missing (Need Migration 024)

| RPC | Priority |
|---|---|
| `get_dashboard_stats` | P0 |
| `next_quote_number` | P0 |
| `get_quote_admin` | P0 |
| `get_profile_admin` | P0 |
| `get_quote_items` | P0 |
| `record_quote_action` | P0 |
| `cleanup_expired_admin_sessions` | P1 |
| `purge_soft_deleted_quotes` | P1 |
| `downgrade_expired_plans` | P1 |
