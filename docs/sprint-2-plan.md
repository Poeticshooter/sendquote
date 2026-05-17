# Sprint 2 Plan

## Scope: SQ-6 to SQ-10 + Dark Mode Polish

---

## SQ-6: Per-quote activity timeline on /quote/[id]

**Summary:** Enhance the existing ActivityTimeline component to merge `quote_events` data with `activity_logs`, showing a unified timeline on the quote detail page.

**Current state:**
- `QuoteDetailClient.tsx` already fetches `quote_events` (line 71) and renders them as a separate "Tracking Events" section (lines 446-465)
- `ActivityTimeline` component reads from `activity_logs` table only
- The two data sources are shown separately, creating confusion

**Plan:**
1. Modify `ActivityTimeline` component to accept an optional `events` prop (the `quote_events` data already fetched by `QuoteDetailClient`)
2. Merge `activity_logs` and `quote_events` into a single unified timeline, sorted by `created_at DESC`
3. Map `quote_events.event_type` to the same icon/label system used by `ActivityTimeline`
4. Add Supabase realtime subscription on `quote_events` table for live updates
5. Improve empty state: "No activity yet — send this quote to start tracking"
6. Add dark mode fixes to the component (already has hardcoded light-mode colors)

**Data sources:** `quote_events` table, `activity_logs` table
**API endpoints:** None needed (client-side Supabase queries)
**Components to touch:** `src/components/activity-timeline.tsx`, `src/app/quote/[id]/QuoteDetailClient.tsx`
**Assumptions:** `quote_events` RLS allows SELECT for quote owners (already confirmed in schema)

---

## SQ-7: Dashboard "Awaiting Response" and "Hot Leads" widgets

**Summary:** Add two new widgets below stat cards on the main dashboard.

**"Awaiting Response" widget:**
- Shows quotes with `status IN ('sent', 'opened')` that haven't been accepted/expired/changes_requested
- Sorted by most recent `quote_events.created_at` (last opened or sent date)
- Shows: client name, quote number, days since sent, view count
- Click routes to `/quote/[id]`

**"Hot Leads" widget:**
- Shows quotes with 2+ `viewed` or `opened` events in the last 48 hours
- Highlighted with a warm accent color
- Shows: client name, quote number, view count, total value
- Click routes to `/quote/[id]`

**Plan:**
1. Create `src/components/dashboard/AwaitingResponse.tsx` widget
2. Create `src/components/dashboard/HotLeads.tsx` widget
3. Add server-side data fetching in `src/app/dashboard/page.tsx`:
   - Query `quotes` + `quote_events` for awaiting response quotes
   - Query `quote_events` with 48-hour window for hot leads
4. Render widgets between `StatsCards` and `MonthlyChart` in `DashboardShell`
5. Use efficient SQL via RPC or direct queries with proper indexes

**Data sources:** `quotes` table, `quote_events` table
**API endpoints:** None (server component queries)
**Components to touch:** `src/app/dashboard/page.tsx`, `src/app/dashboard/DashboardShell.tsx`
**New components:** `src/components/dashboard/AwaitingResponse.tsx`, `src/components/dashboard/HotLeads.tsx`
**Assumptions:** `quote_events` has `idx_quote_events_created` index for efficient time-range queries

---

## SQ-8: User-facing analytics page at /analytics

**Summary:** Create `/analytics` route with charts and stat cards for quote performance.

**Charts:**
1. **Line chart:** Quotes created vs accepted per week (last 12 weeks) — using recharts
2. **Bar chart:** Revenue by month (last 6 months) — based on accepted quotes' `total` field

**Stat cards:**
- Acceptance rate (accepted / total sent)
- Total value sent (sum of all quotes with `status IN ('sent', 'opened', 'accepted')`)
- Total value accepted (sum of accepted quotes)
- Average quote value (total value / total quotes)

**Plan:**
1. Create `src/app/analytics/page.tsx` (server component)
2. Create `src/app/analytics/AnalyticsClient.tsx` (client component with charts)
3. Compute aggregations in the server component using SQL:
   - Weekly created/accepted counts: `DATE_TRUNC('week', created_at)` grouping
   - Monthly revenue: `DATE_TRUNC('month', created_at)` grouping where `status = 'accepted'`
   - Stat cards: simple aggregations on `quotes` table
4. Use recharts `LineChart` and `BarChart` (already installed)
5. Add loading skeleton and "create your first quote" empty state
6. Add to dashboard sidebar navigation

**Data sources:** `quotes` table, `quote_events` table (for view counts)
**API endpoints:** None (server component queries)
**Components to touch:** `src/app/dashboard/DashboardShell.tsx` (add sidebar link)
**New files:** `src/app/analytics/page.tsx`, `src/app/analytics/AnalyticsClient.tsx`
**Assumptions:** Recharts is already installed; CSS variables work for dark mode charts

---

## SQ-9: Fix Admin "Quotes" tab to show actual quotes

**Summary:** The admin dashboard Quotes tab renders `filteredUsers` instead of `filteredQuotes` (line 571 of `AdminDashboardClient.tsx`).

**Current bug:**
- Tab header says "All Quotes ({stats.totalQuotes})"
- Search input sets `quoteSearch` state
- `filteredQuotes` is computed correctly
- BUT table body iterates `filteredUsers` (copy-paste error)
- Columns show user/subscription fields, not quote fields

**Plan:**
1. Replace `filteredUsers.map(user => ...)` with `filteredQuotes.map(quote => ...)`
2. Update table columns to: Client, Quote #, Status, Value, Sent Date, Last Opened, Owner
3. Add status badge styling using existing `getStatusStyle` utility
4. Format value with `formatINR`
5. Add link to `/quote/[id]` for each row
6. Ensure search/filter works on client_name, quote_number, status
7. Add empty state when no quotes match

**Data sources:** `stats.recentQuotes` (already fetched in admin stats)
**API endpoints:** None (uses existing admin stats data)
**Components to touch:** `src/app/admin/dashboard/AdminDashboardClient.tsx` (lines 545-628)
**Assumptions:** `recentQuotes` from admin stats includes: `id, client_name, quote_number, status, total, created_at, user_id`

---

## SQ-10: Fix MRR calculation to use active subscriptions only

**Summary:** Current MRR is calculated from user plan head counts, not actual subscription data.

**Current logic (line 89 of `/api/admin/stats/route.ts`):**
```ts
const mrr = (starterUsers || 0) * 299 + (proUsers || 0) * 799 + (entUsers || 0) * 2499
```

**New logic:**
- Query `subscriptions` table where `status = 'active'` AND `current_period_end > NOW()`
- Sum the `amount` field from active subscriptions
- Return MRR breakdown by plan tier
- Also return "Active Subscriptions" count and "Total Users" count separately

**Plan:**
1. Update `src/app/api/admin/stats/route.ts`:
   - Query `subscriptions` table for active subscriptions
   - Calculate MRR from `SUM(amount)` where active
   - Group by plan tier for breakdown
   - Return `mrr`, `activeSubscriptions`, `totalUsers`, `mrrByPlan`
2. Update `AdminDashboardClient.tsx` to display new MRR data
3. Add/update tests for MRR logic

**Data sources:** `subscriptions` table, `profiles` table
**API endpoints:** `GET /api/admin/stats` (modified)
**Components to touch:** `src/app/api/admin/stats/route.ts`, `src/app/admin/dashboard/AdminDashboardClient.tsx`
**Assumptions:** `subscriptions` table has: `id, user_id, plan, amount, status, current_period_end`

---

## Dark Mode Polish

**Summary:** Fix remaining components that are visually broken in dark mode.

**Components to fix:**
1. `StatsCards` — hardcoded `bg-white`, `bg-orange-50`, `bg-red-50`, no `dark:` variants
2. `MonthlyChart` — `bg-white` container, hardcoded tick colors
3. `QuoteTable` — rows use `bg-slate-50`, `border-slate-100`, `text-slate-900` without `dark:` variants
4. `ActivityTimeline` — hardcoded `bg-emerald-100`, `bg-blue-100`, `bg-amber-100`, `bg-slate-100`, `bg-slate-200`
5. `PublicQuoteClient` (`/q/[token]`) — no dark mode at all
6. `AdminDashboardClient` — entirely light-mode only
7. Upgrade popup/modal — verify dark mode consistency

**Approach:**
- Use CSS variables (`--surface`, `--surface-alt`, `--border`, `--text`, etc.) where possible
- Add `dark:` Tailwind variants for component-specific overrides
- Do NOT redesign — only ensure contrast and readability are acceptable

---

## Execution Order

1. **SQ-9** (quick fix, 1 file) — Admin Quotes tab
2. **SQ-10** (API change + UI update) — MRR calculation
3. **SQ-6** (component enhancement) — Activity timeline
4. **SQ-7** (new widgets + server queries) — Dashboard widgets
5. **SQ-8** (new page + charts) — Analytics page
6. **Dark mode polish** (across multiple components)
7. **Tests + lint + typecheck**
