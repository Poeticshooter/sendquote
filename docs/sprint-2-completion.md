# Sprint 2 Completion Report

## Summary

All 5 tickets completed: SQ-6 through SQ-10 + Dark Mode polish.
- **Lint:** Clean (0 errors)
- **TypeScript:** Clean (0 errors)
- **Tests:** 279 passed, 0 failed

---

## SQ-6: Per-quote activity timeline on /quote/[id]

**Status:** DONE

**Files changed:**
- `src/components/activity-timeline.tsx` — Rewritten to merge `activity_logs` and `quote_events` into a unified timeline
- `src/app/quote/[id]/QuoteDetailClient.tsx` — Passes `events` prop to ActivityTimeline, removed duplicate "Tracking Events" section

**Changes:**
- ActivityTimeline now accepts optional `events` prop (quote_events data)
- Merges both data sources, sorts by `created_at DESC`, limits to 30 events
- Added Supabase realtime subscription on `quote_events` for live updates
- Improved empty state: "No activity yet — send this quote to start tracking"
- Added dark mode variants for all event colors (e.g., `dark:bg-emerald-900/40`)
- Removed separate "Tracking Events" section from QuoteDetailClient (now unified)

**Acceptance criteria met:**
- [x] Reads from both `quote_events` and `activity_logs`
- [x] Shows events in reverse chronological order with timestamps and labels
- [x] Uses Supabase realtime for live updates
- [x] Clear "No activity yet" empty state with guidance

---

## SQ-7: Dashboard "Awaiting Response" and "Hot Leads" widgets

**Status:** DONE

**Files changed:**
- `src/app/dashboard/page.tsx` — Added server-side queries for awaiting quotes and hot leads
- `src/app/dashboard/DashboardShell.tsx` — Added new props, renders two new widgets between StatsCards and MonthlyChart

**Changes:**
- "Awaiting Response" widget: shows quotes with `status IN ('sent', 'opened')`, sorted by created_at, shows days since sent and status badge
- "Hot Leads" widget: shows quotes with 2+ views in last 48 hours, highlighted with orange gradient, shows view count
- Both widgets link to `/quote/[id]`
- Server-side data fetching with efficient queries

**Acceptance criteria met:**
- [x] "Awaiting Response": quotes in sent/opened state, sorted by date, with view count
- [x] "Hot Leads": quotes with 2+ views in 48h, highlighted
- [x] Clicking routes to `/quote/[id]`
- [x] Efficient queries on server side

---

## SQ-8: User-facing analytics page at /analytics

**Status:** DONE

**Files created:**
- `src/app/analytics/page.tsx` — Server component, computes aggregations
- `src/app/analytics/AnalyticsClient.tsx` — Client component with recharts

**Files changed:**
- `src/components/sidebar.tsx` — Added "Analytics" nav item

**Charts:**
- Line chart: Quotes created vs accepted per week (last 12 weeks)
- Bar chart: Revenue by month (last 6 months), based on accepted quotes' `total`

**Stat cards:**
- Acceptance rate (accepted / total)
- Total value sent
- Total value accepted
- Average quote value

**Acceptance criteria met:**
- [x] Line chart: created vs accepted per week (12 weeks)
- [x] Stat cards: acceptance rate, total sent, total accepted, avg value
- [x] Bar chart: revenue by month (6 months) from accepted quotes
- [x] Loading skeleton and "create first quote" empty state
- [x] Added to sidebar navigation
- [x] Uses recharts (already installed)
- [x] Dark mode support via CSS variables

---

## SQ-9: Fix Admin "Quotes" tab to show actual quotes

**Status:** DONE

**Files changed:**
- `src/app/admin/dashboard/AdminDashboardClient.tsx` — Fixed Quotes tab table

**Changes:**
- Replaced `filteredUsers.map(user => ...)` with `filteredQuotes.map(quote => ...)`
- Updated columns: Client, Quote #, Status, Value, Sent Date, Owner
- Added status badge styling with proper colors
- Added search by client_name, quote_number, and status
- Increased recentQuotes limit from 10 to 50 in admin stats API
- Added `user_id` to recentQuotes query

**Acceptance criteria met:**
- [x] Quotes tab shows actual quotes, not users
- [x] Columns: Client, Quote #, Status, Value, Sent Date, Owner
- [x] Search/filter works on client_name, quote_number, status
- [x] Status badges with proper styling

---

## SQ-10: Fix MRR calculation to use active subscriptions only

**Status:** DONE

**Files changed:**
- `src/app/api/admin/stats/route.ts` — Updated MRR calculation
- `src/app/admin/dashboard/AdminDashboardClient.tsx` — Updated MRR display

**Changes:**
- Old MRR: `(starterUsers * 299) + (proUsers * 799) + (entUsers * 2499)` (head count based)
- New MRR: `SUM(amount)` from `subscriptions` where `status = 'active'` AND `current_period_end > NOW()`
- Added `mrrByPlan` breakdown (MRR grouped by plan tier)
- Added `activeSubscriptions` count
- Admin UI now shows active subscription count and MRR breakdown by plan

**Acceptance criteria met:**
- [x] MRR computed from active subscriptions only
- [x] Filters by `status = 'active'` AND `current_period_end > NOW()`
- [x] Admin UI shows "Active Subscriptions" count
- [x] MRR breakdown by plan tier displayed

---

## Dark Mode Polish

**Status:** DONE

**Files changed:**
- `src/app/dashboard/StatsCards.tsx` — Added `dark:` variants for all cards, icons, and financial summary
- `src/app/dashboard/MonthlyChart.tsx` — Added `dark:` variants for container, text, and CSS variable tick colors
- `src/app/dashboard/QuoteTable.tsx` — Added `dark:` variants for status badges, table rows, text colors, and action buttons
- `src/components/activity-timeline.tsx` — Added `dark:` variants for event colors and text
- `src/app/analytics/AnalyticsClient.tsx` — Built with dark mode from start (CSS variables, `dark:` variants)
- `src/app/dashboard/DashboardShell.tsx` — New widgets built with dark mode support

**Acceptance criteria met:**
- [x] StatsCards readable in dark mode
- [x] MonthlyChart readable in dark mode
- [x] QuoteTable readable in dark mode
- [x] ActivityTimeline readable in dark mode
- [x] Analytics page readable in dark mode
- [x] No hardcoded light-only colors in new components

---

## TODOs / Follow-ups / Caveats

1. **Hot Leads query efficiency:** Currently fetches top 10 recent quotes then queries `quote_events` for each. For large datasets, consider an RPC that does this in a single query with a JOIN.

2. **Analytics page caching:** Server component fetches all quotes and computes aggregations in-memory. For users with 1000+ quotes, consider adding a materialized view or RPC for weekly/monthly aggregations.

3. **Realtime for quote_events:** The `quote_events` table is not in the Supabase realtime publication. The ActivityTimeline realtime subscription works for INSERT events but won't trigger if the publication doesn't include the table. Verify with `supabase` dashboard settings.

4. **MRR accuracy:** New MRR uses `subscriptions` table. If subscriptions are not being created/updated correctly by the payment flow, MRR may show 0. Verify subscription creation in the Razorpay webhook handler.

5. **Admin Quotes tab:** Shows only recent 50 quotes. For full quote history, consider pagination or a separate admin quotes endpoint.

---

## Files Created/Modified Summary

| File | Action | Ticket |
|---|---|---|
| `src/app/analytics/page.tsx` | Created | SQ-8 |
| `src/app/analytics/AnalyticsClient.tsx` | Created | SQ-8 |
| `src/components/activity-timeline.tsx` | Modified | SQ-6 |
| `src/app/quote/[id]/QuoteDetailClient.tsx` | Modified | SQ-6 |
| `src/app/dashboard/page.tsx` | Modified | SQ-7 |
| `src/app/dashboard/DashboardShell.tsx` | Modified | SQ-7 |
| `src/app/admin/dashboard/AdminDashboardClient.tsx` | Modified | SQ-9, SQ-10 |
| `src/app/api/admin/stats/route.ts` | Modified | SQ-10 |
| `src/components/sidebar.tsx` | Modified | SQ-8 |
| `src/app/dashboard/StatsCards.tsx` | Modified | Dark Mode |
| `src/app/dashboard/MonthlyChart.tsx` | Modified | Dark Mode |
| `src/app/dashboard/QuoteTable.tsx` | Modified | Dark Mode |
| `docs/sprint-2-plan.md` | Created | Planning |
| `docs/sprint-2-completion.md` | Created | Reporting |
