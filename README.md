# SendQuote.in — AI-Powered Quoting for Indian Businesses

SendQuote is a production-grade SaaS platform for Indian businesses to create, send, and manage professional quotes with AI generation, GST compliance, e-signatures, payment collection (Razorpay), CRM sync, and deal rooms.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui (nova) |
| Database | Supabase PostgreSQL 17 |
| Auth | Supabase SSR (email + Google OAuth) |
| AI | Groq (LLaMA 70B), Gemini (fallback) |
| Payments | Razorpay (UPI, cards, netbanking) |
| Email | Resend |
| Monitoring | Sentry (errors) + PostHog (analytics) |
| Animation | Motion (Framer Motion) |
| Testing | Vitest (unit, 119 tests) + Playwright (E2E) |
| Deployment | Vercel |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env vars
cp .env.local.example .env.local
# Fill in your Supabase, Razorpay, Groq, etc. keys

# 3. Run dev server
pnpm dev

# 4. Run tests
pnpm test

# 5. Type check & lint
pnpm typecheck
pnpm lint
```

## Features

- [x] AI Quote Generation (60s from plain description)
- [x] Interactive Deal Rooms with real-time chat
- [x] Buyer Intent Tracking
- [x] E-Signature Collection
- [x] Razorpay Payment Integration
- [x] Automated GST Invoicing
- [x] AI Deal Copilot (win/loss analysis)
- [x] AI Follow-Up Emails (scheduled)
- [x] AI Voice Assistant
- [x] CRM Sync (HubSpot, Pipedrive)
- [x] Approval Workflows
- [x] Client Portal
- [x] Team Management
- [x] Gamification (achievements, health score, referrals)
- [x] Admin Panel
- [x] Multi-language (EN, HI, MR)
- [ ] Stripe Integration
- [ ] Salesforce CRM Sync

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, signup, forgot password, onboarding
│   ├── (dashboard)/        # Dashboard, quotes, clients, invoices, analytics, admin, settings, portal
│   ├── (marketing)/        # Landing, pricing, features, blog, docs, FAQ, contact, changelog
│   ├── api/                # 42 REST API routes with Zod validation
│   │   ├── ai/             # AI quote generation, copilot, follow-up, voice
│   │   ├── quotes/         # CRUD, send, accept with e-signature
│   │   ├── webhook/        # Razorpay + n8n webhooks with idempotency
│   │   ├── payments/       # Razorpay order creation
│   │   ├── crm/            # HubSpot + Pipedrive sync
│   │   ├── team/           # Team invite management
│   │   ├── auth/           # Signup profile creation
│   │   ├── chat/           # Deal room messaging
│   │   └── ...             # Analytics, CRM, events, expiry, followup, portal, health, etc.
│   ├── q/                  # Public quote view (deal room)
│   ├── layout.tsx          # Root layout with theme, PostHog, Sentry, cookie consent
│   ├── globals.css         # Tailwind v4 CSS-first config with design tokens
│   ├── error.tsx           # Global error boundary
│   ├── loading.tsx         # Root loading state
│   └── not-found.tsx       # 404 page
├── components/
│   ├── ui/                 # 36 shadcn/ui components (button, card, dialog, table, etc.)
│   ├── landing/            # Navbar, hero, features, how-it-works, pricing, CTA, footer
│   ├── shared/             # Sidebar, theme, PostHog, cookie consent, voice assistant, command palette
│   ├── deal-room/          # Public quote view, sign flow, signature pad, expiry countdown
│   ├── quotes/             # Activity timeline, deal copilot, follow-up panel
│   ├── settings/           # Approval rules, CRM, billing, SSO, team, follow-up
│   └── gamification/       # Achievement badges, health score, referral widget
├── lib/
│   ├── supabase/           # Server/client/admin clients + typed queries (server.ts, client.ts, queries.ts)
│   ├── ai/                 # AI generation (generate-quote.ts, follow-up.ts, voice.ts)
│   ├── contracts/          # HTML contract generation with XSS escaping
│   ├── crm/                # HubSpot + Pipedrive sync (unified callCrmApi)
│   ├── email/              # Email templates and sending (templates.ts, send.ts)
│   ├── security/           # CSRF protection, rate limiting, cron secret verification
│   ├── config.ts           # Runtime env var validation
│   ├── rate-limit.ts       # Shared in-memory rate limiter
│   ├── api-validation.ts   # Zod schemas for all API routes
│   ├── plan-gates.ts       # Plan limit enforcement (quotes, team, AI)
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── types/                  # TypeScript interfaces
└── instrumentation.ts      # Sentry initialization
```

## API Routes (42 endpoints)

All routes have **Zod schema validation**, **ownership checks**, **rate limiting**, and **Sentry error reporting**.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/quotes` | GET/POST | List/create quotes |
| `/api/quotes/[id]` | GET/PATCH/DELETE | Get/update/delete quote |
| `/api/quotes/send` | POST | Send quote via email |
| `/api/quotes/accept` | POST | Accept with e-signature |
| `/api/ai/generate` | POST | AI quote from description |
| `/api/ai/copilot` | POST | Deal analysis & suggestions |
| `/api/ai/followup` | POST | AI follow-up email |
| `/api/voice` | POST | Voice assistant response |
| `/api/payments/razorpay` | POST | Create Razorpay order |
| `/api/webhook/razorpay` | POST | Razorpay webhook (idempotent) |
| `/api/webhooks/n8n` | POST | n8n automation webhook |
| `/api/analytics` | GET | Quote analytics with date filter |
| `/api/clients` | GET/POST | Client management |
| `/api/portal` | POST | Client portal by email |
| `/api/crm/sync` | POST | Sync to HubSpot/Pipedrive |
| `/api/subscriptions` | GET | User subscription info |
| `/api/events` | POST | Track quote events |
| `/api/referrals` | GET/POST | Referral program |
| `/api/achievements` | GET | User achievements |
| `/api/achievements/check` | POST | Check & award achievements |
| `/api/health-score` | GET | Account health score |
| `/api/approval-rules` | GET/POST | Approval workflow rules |
| `/api/approval-rules/check` | POST | Check approval needed |
| `/api/followup/schedule` | POST | Schedule follow-up |
| `/api/followup/process` | POST | Process scheduled follow-ups |
| `/api/expiry/check` | GET | Quote expiry cron |
| `/api/gst/validate` | POST | GSTIN validation |
| `/api/pincode/lookup` | GET | Indian pincode lookup |
| `/api/team/invite` | POST | Team member invitation |
| `/api/chat` | POST | Deal room chat |
| `/api/seo/ping` | POST | SEO ping notification |
| `/api/templates` | GET | Quote templates |
| `/api/admin/stats` | GET | Admin dashboard stats |
| `/api/auth/signup-profile` | POST | Post-signup profile setup |

## Security

- **CSP headers** — restrictive Content-Security-Policy with nonce support
- **Rate limiting** — DB-backed (primary) + shared in-memory (fallback), 100 req/min/IP
- **Bot detection** — curated blocklist (Googlebot, GPTBot, Claude-Web, etc.)
- **CSRF protection** — double-submit cookie pattern with origin verification
- **IDOR protection** — all quote/data routes verify user ownership
- **XSS prevention** — HTML escaping in contract & email generation
- **Webhook verification** — HMAC-SHA256 with `timingSafeEqual`
- **Webhook idempotency** — duplicate event detection via unique constraint
- **Input validation** — Zod schema on every API route
- **Plan enforcement** — quota gates wired into quote creation
- **Strict TypeScript** — `strict: true` in tsconfig
- **z-index scale** — CSS variables (`--z-dropdown` through `--z-tooltip`)

## Testing

```bash
pnpm test              # Run 119 unit tests (Vitest)
pnpm test:watch        # Watch mode
pnpm test:e2e          # E2E tests (Playwright)
pnpm typecheck         # TypeScript strict check
pnpm lint              # ESLint
pnpm build             # Production build
```

## Accessibility

- WCAG AA compliant contrast ratios throughout
- Skip navigation link on dashboard
- `aria-label` on all icon-only buttons
- Focus-visible rings on interactive elements
- `prefers-reduced-motion` respected globally
- Progress bars with ARIA attributes
- Form inputs with proper labels

## Design System

- **36 shadcn/ui primitives** (button, card, input, dialog, table, etc.)
- **36+ custom components** across 7 domains
- **72+ total components**
- Flat Design style with teal (`#00D4AA`) primary
- Dark-mode-first, CSS variable architecture
- Motion (Framer Motion) for animated landing sections

## Database (34+ tables)

Core tables in `public` schema with Row-Level Security:

- **Quotes:** `quotes`, `quote_items`, `quote_events`, `quote_signatures`
- **Billing:** `invoices`, `invoice_items`, `payments`, `subscriptions`
- **CRM:** `clients`, `leads`
- **Workflow:** `approval_rules`, `approval_requests`, `deal_room_messages`, `cron_reminders`
- **Auth:** `profiles`, `organizations`, `organization_members`, `team_members`
- **Gamification:** `achievements`, `user_achievements`, `health_scores`, `referrals`
- **System:** `feature_flags`, `analytics_events`, `activity_logs`, `webhook_events`, `rate_limits`, `error_logs`, `feedback`

## License

Private — SendQuote.in
