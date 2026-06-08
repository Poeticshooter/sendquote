# SendQuote — Master Reference

**Project:** SendQuote — AI-Powered Revenue Workflow Platform
**Domain:** sendquote.in
**Supabase Project:** yabsujbilznpoayueokq
**Last updated:** 2026-06-08

## Tech Stack
- **Framework:** Next.js 16.2 (App Router, Turbopack)
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui (nova)
- **Database:** Supabase PostgreSQL 17 (34+ tables, RLS)
- **Auth:** Supabase Auth (email + Google SSO)
- **Email:** Resend
- **Payments:** Razorpay (India)
- **AI:** Groq (primary) + Gemini (fallback)
- **Analytics:** PostHog + Vercel Analytics
- **Monitoring:** Sentry (all API routes + client)
- **Animation:** Motion (Framer Motion) v12
- **Testing:** Vitest (119 unit tests) + Playwright (E2E)
- **Hosting:** Vercel

## Architecture
Single Next.js app. Frontend + API routes in one project.
- `src/app/(marketing)/` — Public pages (SSR/SSG)
- `src/app/(auth)/` — Auth pages (centered layout)
- `src/app/(dashboard)/` — Protected app (sidebar + header layout)
- `src/app/q/[token]/` — Public quote view (SSR)
- `src/app/api/` — API routes (42 endpoints)
- `src/components/` — 72+ UI, landing, shared, deal-room, quotes, settings, gamification components
- `src/lib/` — Supabase, AI, email, payment, CRM, security, rate-limit, config, plan-gates utils
- `src/types/` — TypeScript interfaces

## Routes (56 total)
- **Static pages (27):** /, /blog, /changelog, /clients, /contact, /docs, /faq, /features, /forgot-password, /invoices, /login, /onboarding, /portal, /pricing, /privacy, /quotes, /quotes/new, /settings, /signup, /terms, /analytics, /admin, /admin/logs, /admin/users, /robots.txt, /sitemap.xml, /manifest.json, /_not-found, /api/llmstxt, /opensearch.xml
- **Dynamic routes (29):** /q/[token], /quotes/[id], /quotes/[id]/edit, /invoices/[id], /blog/[slug], /portal/[token], 42 API endpoints

## Implementation Status
| Phase | Status | Key Deliverables |
|---|---|---|
| A1: Foundation | ✅ Complete | Landing, auth, dashboard, error pages, middleware, CSP |
| A2: Quote Builder | ✅ Complete | CRUD, public view, send, PDF, plan gates |
| A3: Deal Room | ✅ Complete | Buyer tracking, real-time chat, activity timeline, e-signature |
| A4: Payments & E-Sign | ✅ Complete | E-sign pad, Accept & Pay, Razorpay, auto-invoice, balance_due |
| A5: Approval Workflows | ✅ Complete | Approval rules, AI follow-ups, expiry countdown, scheduling |
| A6: AI Quote Generation | ✅ Complete | AI first draft, 5 industry templates, smart pricing, templates |
| A7: CRM Sync | ✅ Complete | HubSpot, Pipedrive, n8n webhook, auto-sync on accept |
| A8: Contracts + Portal | ✅ Complete | Contract generator (HTML), client portal (email lookup) |
| A9: Intelligence | ✅ Complete | Win/loss analytics, Deal Copilot, pipeline view, health score |
| A10: Enterprise | ✅ Complete | SSO/SAML, team management, multi-currency, CPQ basics, plan gates |
| B1: Gamification | ✅ Complete | Achievements, referrals, health score, leaderboard |
| B2: SEO & Infra | ✅ Complete | llms.txt, sitemap, JSON-LD, CSP, Sentry, PostHog, robots.txt |

## Database (34+ Tables)
- **Core:** profiles, organizations, quotes, quote_items, quote_events, quote_signatures
- **Billing:** invoices, invoice_items, payments, subscriptions
- **CRM:** clients, leads
- **Workflow:** approval_rules, approval_requests, deal_room_messages, cron_reminders, email_templates
- **Auth:** profiles, organizations, organization_members, team_members
- **Gamification:** achievements, user_achievements, health_scores, referrals
- **System:** feature_flags, analytics_events, activity_logs, webhook_events, rate_limits, error_logs, feedback, voice_sessions

## Design System (72+ Components)
- **shadcn/ui (36):** button, card, input, select, dialog, table, badge, avatar, dropdown-menu, tabs, sonner, skeleton, separator, tooltip, progress, pagination, breadcrumb, alert, sheet, switch, command, popover, form, textarea, label, checkbox, accordion, date-picker, stepper, otp-input, search-input, file-upload, empty-state, loading-overlay, notification-center, ai-chat-interface
- **Custom (36+):** SearchInput, DatePicker, FileUpload, Accordion, EmptyState (3 variants), LoadingOverlay, Stepper, OTPInput, NotificationCenter, AIChatInterface, SignaturePad, SignQuoteFlow, DealRoomClient, ExpiryCountdown, ActivityTimeline, DealCopilot, FollowUpPanel, CookieConsent, SkipNav, ThemeProvider, ThemeToggle, PostHogProvider, Navbar, Hero, FeaturesGrid, HowItWorks, PricingTable, CTASection, Footer, Sidebar, UserNav, BottomNav, VoiceAssistant, CommandPalette, ApprovalRules, CrmSettings, SSOSettings, BillingSettings, TeamSettings, FollowUpSettings, AchievementBadges, HealthScore, ReferralWidget

## Security Posture
- CSP headers with nonce support
- DB-backed rate limiting with shared in-memory fallback
- CSRF double-submit cookie pattern
- Origin verification on all requests
- Bot detection (Googlebot, GPTBot, Claude-Web, etc.)
- IDOR protection on all data routes
- XSS prevention in contract/email generation
- Webhook HMAC-SHA256 verification (`timingSafeEqual`)
- Webhook idempotency via unique constraint
- Zod validation on all API routes
- Plan gates on quote creation
- Cron secret verification on scheduled endpoints
- Env var validation at startup (`src/lib/config.ts`)

## Key Improvements (2026-06-08 Session)
- Removed `setInterval` rate-limit cleanup (serverless-incompatible)
- Wired plan gates into quote creation
- Fixed Razorpay amount to use `balance_due`
- Atomic quote number generation via RPC
- Shared rate-limit module (3 copies consolidated)
- Split god schema file by domain
- All API routes now report to Sentry
- Fixed CSRF cookie for API routes
- UI/UX audit: contrast, accessibility, theme-hardcoded fixes across ~50 files
- prefers-reduced-motion support globally
- z-index CSS variable scale added
- Auth + marketing layouts created
- Auth pages: loading spinners, consistent image handling
- Fixed `window.location.origin` SSR hydration crash
- Removed localStorage for API keys/OIDC configs

## Links
- **Live:** https://sendquote.in
- **GitHub:** https://github.com/Poeticshooter/sendquote
