# SendQuote — Project Completion Plan

**Generated:** 2026-05-17
**Updated:** 2026-05-17 (Sprints 1–6 complete)
**Status:** MVP COMPLETE. Product readiness score: 87/100.
**Goal:** Move from "partially complete" to fully MVP-ready for real user onboarding.

---

## Completed Tickets (Sprint 1–6)

| Ticket | Title | Status |
|---|---|---|
| SQ-1 | Add `archived`/`lost` to quotes.status CHECK | DONE |
| SQ-2 | Fix invoice PDF `unpaid` → `pending` watermark | DONE |
| SQ-3 | Add `invoice_id` to `cron_reminders` + fix FK | DONE |
| SQ-4 | Audit/create missing RPCs + health endpoint | DONE |
| SQ-5 | Fix "Save & Send" to actually send email | DONE |
| SQ-6 | Per-quote activity timeline on /quote/[id] | DONE |
| SQ-7 | Dashboard "Awaiting Response" + "Hot Leads" widgets | DONE |
| SQ-8 | User-facing analytics page at /analytics | DONE |
| SQ-9 | Fix Admin "Quotes" tab to show actual quotes | DONE |
| SQ-10 | Fix MRR calculation to use active subscriptions | DONE |
| SQ-11 | DB-backed email templates with variables | DONE |
| SQ-12 | First-run onboarding wizard | DONE (pre-existing) |
| SQ-13 | Empty states + loading skeletons | DONE (pre-existing) |
| SQ-14 | Password reset flow | DONE |
| SQ-15 | Email verification enforcement | DONE |
| SQ-16 | Quote versioning UI | DONE |
| SQ-17 | SMTP email primary + Resend fallback | DONE |
| SQ-18 | Team invite flow | DONE |
| SQ-19 | Invoice CRUD + payment APIs | DONE |
| SQ-20 | Proration logic | DEFERRED |
| SQ-21 | Final QA | DONE |
| SQ-22 | Voice/Chat Assistant (Parts B, C, E) | DONE (beta-gated) |
| Feedback | In-app feedback system + admin tab | DONE |
| Dark Mode | Infrastructure fix + component polish | DONE |

---

## Remaining Tickets (SQ-11 through SQ-21)

Based on the Issue Tracker, TODO.md Phase 7, AUDIT.md findings, and ROADMAP gaps:

| Ticket | Title | Priority | Source |
|---|---|---|---|
| **SQ-11** | DB-backed email templates with variables + admin preview | P1 | Issue Tracker + TODO Phase 7 |
| **SQ-12** | First-run onboarding wizard for new users | P1 | Issue Tracker + AUDIT M1/M2 |
| **SQ-13** | Empty states + loading skeletons across all pages | P1 | Issue Tracker + AUDIT M1 |
| **SQ-14** | Password reset flow (forgot/reset) end-to-end | P1 | Issue Tracker |
| **SQ-15** | Email verification enforcement + resend | P1 | Issue Tracker |
| **SQ-16** | Quote versioning UI (version history + diff) | P2 | TODO Phase 7 + AUDIT H5 |
| **SQ-17** | SMTP email primary + Resend fallback (switch from Resend-only) | P1 | AUDIT C5 + ROADMAP Phase 2 |
| **SQ-18** | Team invite flow complete (accept + email notification) | P2 | AUDIT M9 + ROADMAP Phase 3 |
| **SQ-19** | Invoice CRUD API + payment recording API | P2 | AUDIT M7/M8 + ROADMAP Phase 3 |
| **SQ-20** | Proration logic for mid-cycle plan changes | P2 | TODO Phase 7 |
| **SQ-21** | Final QA: README rewrite, dead code removal, env validation, coverage | P1 | AUDIT L1/L3/L6/L7 + ROADMAP Phase 4/5 |

**SQ-22 (Deferred):** Unified voice/chat assistant USP — separate dedicated phase.

---

## Phase A: Email Templates + Onboarding UX

**Goal:** Make the product feel polished and professional from first login through daily use. Email delivery must be reliable (SMTP primary), templates customizable, and new users guided smoothly.

**Tickets:** SQ-11, SQ-12, SQ-13, SQ-17

**Order of implementation:**
1. **SQ-17** — Switch email to SMTP primary (nodemailer) with Resend fallback. This is foundational — all email-dependent features need this first.
2. **SQ-11** — Build `email_templates` table, admin preview, variable substitution (`{{client_name}}`, `{{quote_number}}`, `{{total}}`, etc.). Users can customize quote/invoice email bodies.
3. **SQ-12** — First-run onboarding wizard (business name, logo upload, first quote CTA). Triggered on first login for new users.
4. **SQ-13** — Empty states + loading skeletons on all remaining pages (clients, templates, settings, invoices list). Use existing `EmptyState` and `skeleton` components.

**Key files to touch:**
- `src/lib/email.ts` — SMTP primary, Resend fallback
- `supabase/migrations/026_email_templates.sql` — new table
- `src/app/settings/email-templates/page.tsx` — new route
- `src/components/onboarding-wizard.tsx` — new component
- Various client components for empty states

---

## Phase B: Auth, Billing & UX Polish

**Goal:** Complete the auth flow, fix billing edge cases, and ensure the product is production-ready for real users.

**Tickets:** SQ-14, SQ-15, SQ-16, SQ-18, SQ-19, SQ-20, SQ-21

**Order of implementation:**
1. **SQ-14** — Password reset flow: verify forgot-password and reset-password pages work end-to-end with Supabase Auth.
2. **SQ-15** — Email verification: enforce verified email for key actions, add "resend verification" button in settings.
3. **SQ-16** — Quote versioning: add `version` column display on quote detail, show version history when duplicated.
4. **SQ-18** — Team invite flow: complete accept-invite page, email notification on invite.
5. **SQ-19** — Invoice CRUD API (`/api/invoices`) + payment recording API (`/api/payments`).
6. **SQ-20** — Proration logic for mid-cycle plan changes (Razorpay subscription update).
7. **SQ-21** — Final QA: rewrite README, remove dead code (chat-bot), add env validation, Google Search Console tag, coverage threshold.

**Key files to touch:**
- `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`
- `src/app/settings/page.tsx` — add resend verification
- `src/app/quote/[id]/QuoteDetailClient.tsx` — version display
- `src/app/team/accept/page.tsx` — new route
- `src/app/api/invoices/route.ts` — new
- `src/app/api/payments/route.ts` — new
- `src/lib/env.ts` — new
- `README.md` — rewrite
- `src/components/chat-bot.tsx` — delete

---

## Phase C: Voice + Chat Assistant USP (SQ-22)

**Goal:** Implement the unified voice/chat assistant as a key differentiator.

**Status:** DEFERRED — will be handled in a dedicated prompt with its own plan.

---

## Phase D: Final Go-Live Checklist

**Goal:** Ensure everything is production-ready before opening to real users.

**Tasks:**
- [ ] All migrations pushed to production Supabase
- [ ] All env vars documented in `.env.example`
- [ ] Sentry DSN configured
- [ ] Razorpay keys configured (test + live)
- [ ] Cron job deployed and verified (Vercel Cron)
- [ ] Admin panel credentials set
- [ ] Google Search Console verification tag active
- [ ] Test full user journey: signup → onboarding → create quote → send → client accepts → convert to invoice → record payment
- [ ] Test payment flow: upgrade → Razorpay checkout → webhook → plan change
- [ ] Test email delivery: SMTP primary, Resend fallback
- [ ] Load test: 50 concurrent users on dashboard
- [ ] Backup strategy: Supabase automated backups verified

---

## Known Risks & Gaps

1. **Invoice items table:** `invoice_items` is referenced in code but may not exist in live DB. Verify before SQ-19.
2. **SMTP credentials:** Users may not have Gmail SMTP app passwords ready. Need clear setup instructions in settings.
3. **Razorpay subscription proration:** Razorpay's API for mid-cycle changes is complex. SQ-20 may need careful testing.
4. **Team invites:** Email notification for invites depends on SQ-17 (SMTP) being complete first.
5. **`quote_events` realtime publication:** Table may not be in Supabase realtime publication. SQ-6 realtime may not fire live updates.

---

## Execution Strategy

- Work through Phase A first, then Phase B.
- Run lint + typecheck + tests after each ticket cluster.
- Create `docs/sprint-3-completion.md` after Phase A.
- Create `docs/sprint-4-completion.md` after Phase B.
- Stop before SQ-22 and report status.
