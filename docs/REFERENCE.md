# SendQuote — Master Reference

**Project:** SendQuote — AI-Powered Revenue Workflow Platform
**Domain:** sendquote.in
**Supabase Project:** yabsujbilznpoayueokq

## Tech Stack
- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase PostgreSQL (30 tables pre-existing)
- **Auth:** Supabase Auth (email + Google SSO)
- **Cache:** Upstash Redis (planned)
- **Email:** Resend
- **Payments:** Razorpay (India) + Stripe (Global)
- **AI:** Groq + Gemini
- **Workflows:** n8n (self-hosted)
- **Analytics:** PostHog
- **Monitoring:** Sentry
- **Hosting:** Vercel

## Architecture
Single Next.js app. Frontend + API routes in one project.
- `src/app/(marketing)/` — Public pages (SSR)
- `src/app/(auth)/` — Auth pages
- `src/app/(dashboard)/` — Protected app
- `src/app/q/[token]/` — Public quote view (SSR)
- `src/app/api/` — API routes
- `src/components/` — UI, landing, shared components
- `src/lib/` — Supabase, AI, email, payment utils
- `src/types/` — TypeScript types

## Database (30 Tables Pre-Existing)
Key tables: profiles, organizations, quotes, quote_items, quote_events, invoices, invoice_items, payments, subscriptions, clients, leads, email_templates, cron_reminders, voice_sessions, activity_logs, webhooks, feature_flags.

## Implementation Phases
| Phase | Status |
|---|---|
| A1: Foundation (Landing + Auth + Scaffold) | ✅ Complete |
| A2: Quote Builder (Create, List, View, Send) | ✅ Complete |
| A3: Deal Room + Buyer Tracking | ❌ Not started |
| A4: Payments + E-Signature | ❌ Not started |
| A5: Approval Workflows + Follow-Ups | ❌ Not started |
| A6: AI Quote Generation | ❌ Not started |
| A7: CRM Sync | ❌ Not started |
| A8: Contracts + Client Portal | ❌ Not started |
| A9: Intelligence | ❌ Not started |
| A10: Enterprise Features | ❌ Not started |
