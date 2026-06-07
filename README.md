# SendQuote.in — AI-Powered Quoting for Indian Businesses

SendQuote is a production-grade SaaS platform that lets businesses create GST-ready quotes in 60 seconds using AI. Send interactive deal rooms, collect e-signatures, process payments, and close deals faster.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Database | Supabase PostgreSQL 17 |
| Auth | Supabase SSR (email + Google OAuth) |
| AI | Groq (LLaMA 70B), Gemini (fallback) |
| Payments | Razorpay (India — UPI, cards, netbanking) |
| Email | Resend |
| Monitoring | Sentry |
| Analytics | PostHog |
| Testing | Vitest (unit) + Playwright (E2E) |
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

# 5. Type check
pnpm typecheck
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup, forgot password
│   ├── (dashboard)/     # Dashboard, quotes, clients, invoices, analytics, admin, settings
│   ├── (marketing)/     # Landing, pricing, features, blog, docs, FAQ
│   ├── api/             # 18 REST API routes with Zod validation
│   │   ├── ai/          # AI quote generation, copilot, follow-up, voice
│   │   ├── quotes/      # CRUD, send, accept with e-signature
│   │   ├── webhook/     # Razorpay webhook with idempotency
│   │   └── ...          # Analytics, CRM, payments, chat, portal, health
│   ├── auth/            # Supabase auth callback
│   ├── q/               # Public quote view (deal room)
│   ├── layout.tsx       # Root layout with theme, PostHog, Sentry, voice assistant
│   └── error.tsx        # Global error boundary
├── components/
│   ├── deal-room/       # Public quote view, sign flow, signature pad
│   ├── landing/         # Marketing page sections
│   ├── quotes/          # Activity timeline, follow-up, deal copilot
│   ├── settings/        # Approval rules, CRM, billing, SSO, team
│   ├── shared/          # Sidebar, theme, PostHog, cookie consent, voice assistant
│   └── ui/              # shadcn/ui components (button, card, dialog, etc.)
├── lib/
│   ├── supabase/        # Server/client/admin clients + typed queries
│   ├── ai/              # Generate quote, follow-up, voice
│   ├── contracts/       # HTML contract generation with XSS escaping
│   └── crm/             # HubSpot + Pipedrive sync
├── types/               # TypeScript interfaces
└── instrumentation.ts   # Sentry initialization
```

## API Routes

All routes have **Zod schema validation**, **ownership checks**, and **consistent error handling**.

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
| `/api/analytics` | GET | Quote analytics |
| `/api/clients` | GET/POST | Client management |
| `/api/portal` | POST | Client portal by email |
| `/api/crm/sync` | POST | Sync to HubSpot/Pipedrive |
| `/api/subscriptions` | GET | User subscription info |
| `/api/events` | POST | Track quote events |

## Security

- **CSP headers** — restrictive Content-Security-Policy
- **Rate limiting** — DB-backed with in-memory fallback, 100 req/min/IP
- **Bot detection** — curated list (Googlebot, GPTBot, Claude-Web, etc.)
- **IDOR protection** — all quote/data routes verify ownership
- **XSS prevention** — HTML escaping in contract generation
- **Webhook idempotency** — duplicate event detection via unique constraint
- **Input validation** — Zod schemas on every API route
- **Strict TypeScript** — `strict: true` in tsconfig

## Testing

```bash
pnpm test              # Run 86 tests
pnpm test:watch        # Watch mode
pnpm typecheck         # TypeScript check
pnpm lint              # ESLint
pnpm ci                # Full CI pipeline
```

## Features

- [x] AI Quote Generation (60s)
- [x] Interactive Deal Rooms
- [x] Buyer Intent Tracking
- [x] E-Signature Collection
- [x] Razorpay Payment Integration
- [x] Automated Invoicing
- [x] AI Deal Copilot
- [x] AI Follow-Up Emails
- [x] AI Voice Assistant
- [x] CRM Sync (HubSpot, Pipedrive)
- [x] Approval Workflows
- [x] Client Portal
- [x] Team Management
- [x] Multi-language (EN, HI, MR)
- [ ] Stripe Integration
- [ ] Salesforce CRM Sync

## License

Private — SendQuote.in
