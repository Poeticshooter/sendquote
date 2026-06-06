# SendQuote — Master Reference

**Project:** SendQuote — AI-Powered Revenue Workflow Platform
**Domain:** sendquote.in
**Supabase Project:** yabsujbilznpoayueokq

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase PostgreSQL (30 tables)
- **Auth:** Supabase Auth (email + Google SSO)
- **Email:** Resend
- **Payments:** Razorpay (India) + Stripe (Global)
- **AI:** Groq + Gemini
- **Analytics:** PostHog
- **Monitoring:** Sentry
- **Hosting:** Vercel

## Architecture
Single Next.js app. Frontend + API routes in one project.
- `src/app/(marketing)/` — Public pages (SSR/SSG)
- `src/app/(auth)/` — Auth pages
- `src/app/(dashboard)/` — Protected app
- `src/app/q/[token]/` — Public quote view (SSR)
- `src/app/api/` — API routes (24 endpoints)
- `src/components/` — 60+ UI, landing, shared components
- `src/lib/` — Supabase, AI, email, payment, CRM, security utils
- `src/types/` — TypeScript types

## Routes (51 total)
- **Static pages (28):** /, /blog, /blog/[slug], /changelog, /clients, /contact, /docs, /faq, /features, /forgot-password, /invoices, /login, /portal, /pricing, /privacy, /quotes, /quotes/new, /settings, /signup, /terms, /analytics, /robots.txt, /sitemap.xml, /manifest.json, /_not-found, /api/llmstxt, /opensearch.xml
- **Dynamic routes (23):** /q/[token], /quotes/[id], 21 API endpoints

## Implementation Status
| Phase | Status | Key Deliverables |
|---|---|---|
| A1: Foundation | ✅ Complete | Landing, auth, dashboard, error pages, middleware |
| A2: Quote Builder | ✅ Complete | CRUD, public view, send, PDF |
| A3: Deal Room | ✅ Complete | Buyer tracking, real-time chat, activity timeline |
| A4: Payments & E-Sign | ✅ Complete | E-sign pad, Accept & Pay, Razorpay+Stripe, auto-invoice |
| A5: Approval Workflows | ✅ Complete | Approval rules, AI follow-ups (Groq), expiry countdown |
| A6: AI Quote Generation | ✅ Complete | AI first draft, 5 industry templates, smart pricing |
| A7: CRM Sync | ✅ Complete | HubSpot, Pipedrive, n8n webhook, auto-sync on accept |
| A8: Contracts + Portal | ✅ Complete | Contract generator (HTML), client portal (email lookup) |
| A9: Intelligence | ✅ Complete | Win/loss analytics, Deal Copilot, pipeline view |
| A10: Enterprise | ✅ Complete | SSO/SAML settings, multi-currency, CPQ basics |
| B2: SEO & Infra | ✅ Complete | llms.txt, sitemap, JSON-LD, CSP, Sentry, PostHog |

## Database (30 Tables)
Core: profiles, organizations, quotes, quote_items, quote_events, invoices, invoice_items, payments, subscriptions, clients, leads, email_templates, cron_reminders, voice_sessions, activity_logs, webhooks, feature_flags, deal_room_messages, quote_signatures, approval_rules, approval_requests

## Design System (60+ Components)
- **shadcn/ui (26):** button, card, input, select, dialog, table, badge, avatar, dropdown-menu, tabs, sonner, skeleton, separator, tooltip, progress, pagination, breadcrumb, alert, sheet, switch, command, popover, form, textarea, label, checkbox
- **Custom (34+):** SearchInput, DatePicker, FileUpload, Accordion, EmptyState (3 variants), LoadingOverlay, Stepper, OTPInput, NotificationCenter, AIChatInterface, SignaturePad, AcceptPayFlow, DealRoomClient, ExpiryCountdown, ActivityTimeline, DealCopilot, FollowUpPanel, CookieConsent, SkipNav, ThemeProvider, PostHogProvider, Navbar, Hero, FeaturesGrid, HowItWorks, PricingTable, CTASection, Footer, Sidebar, UserNav, ApprovalRules, CrmSettings, SSOSettings

## Links
- **Live:** https://sendquote.in
- **GitHub:** https://github.com/Poeticshooter/sendquote
