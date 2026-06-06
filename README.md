# SendQuote

**The fastest path from conversation to contract.**

SendQuote is an AI-powered revenue workflow platform that transforms quotations into interactive deal rooms. Generate quotes in 60 seconds, track buyer intent, collect payments, and close deals — all in one place.

## Features

- **AI Quote Generation** — Generate complete quotes from a brief description in under 60 seconds
- **Interactive Deal Room** — Branded, responsive quote pages with real-time buyer tracking
- **Buyer Intent Analytics** — Know exactly who opened your quote, what they viewed, and for how long
- **In-Quote Negotiation** — Buyers can request changes and counter-offer directly inside the quote
- **One-Click E-Signature** — Native signature collection with no redirects
- **Payment Collection** — Accept credit cards, UPI, and bank transfers (Razorpay + Stripe)
- **Approval Workflows** — Rule-based routing for discounts and deal approvals
- **AI Auto Follow-Ups** — Personalized follow-ups triggered by buyer behavior
- **CRM Sync** — Bi-directional sync with HubSpot, Salesforce, and Pipedrive
- **Client Portal** — Single view of all quotes, contracts, invoices, and payments

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + Google SSO) |
| Payments | Razorpay (India) + Stripe (Global) |
| AI | Groq + Gemini |
| Email | Resend |
| Monitoring | Sentry |
| Hosting | Vercel |

## Getting Started

```bash
git clone https://github.com/Poeticshooter/sendquote.git
cd sendquote
pnpm install
cp .env.local.example .env.local
pnpm dev
```

### Environment Variables

See `.env.local.example` for all required variables. Key ones:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `GROQ_API_KEY` — Groq API key for AI features
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay live keys
- `RESEND_API_KEY` — Resend API key for email

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (marketing)/    # Public pages
│   ├── (auth)/         # Auth pages
│   ├── (dashboard)/    # Protected app
│   ├── q/[token]/      # Public quote view
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/             # shadcn/ui components
│   ├── landing/        # Landing page
│   ├── deal-room/      # Deal Room components
│   └── shared/         # Shared components
├── lib/                # Utilities
│   ├── supabase/       # Supabase clients
│   ├── ai/             # AI integration
│   └── crm/            # CRM sync
└── types/              # TypeScript types
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/quotes` | GET, POST | List and create quotes |
| `/api/quotes/[id]` | GET, PATCH | Get and update quote |
| `/api/quotes/send` | POST | Send quote via email |
| `/api/quotes/accept` | POST | Accept quote with signature |
| `/api/clients` | GET, POST | List and create clients |
| `/api/invoices` | GET | List invoices |
| `/api/ai/generate` | POST | AI quote generation |
| `/api/ai/followup` | POST | AI follow-up email |
| `/api/payments/razorpay` | POST | Create Razorpay order |
| `/api/analytics` | GET | Quote analytics |
| `/api/health` | GET | Health check |

## License

MIT
