# SendQuote - Project Documentation

## Overview

SendQuote is a professional quote/invoice management platform built with Next.js, Supabase, and Tailwind CSS. It helps Indian businesses create quotes, share them via WhatsApp, track client responses, and convert quotes to invoices.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Razorpay |
| PDF Generation | @react-pdf/renderer |
| Animations | Framer Motion |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout with providers
│   ├── login/              # User login
│   ├── register/           # User registration
│   ├── dashboard/          # Main user dashboard
│   ├── quote/              # Quote management
│   ├── invoice/            # Invoice management
│   ├── clients/            # Client management
│   ├── settings/           # User settings
│   ├── upgrade/            # Pricing plans
│   ├── templates/          # Quote templates
│   ├── admin/              # Admin panel
│   └── api/                # API routes
├── components/             # Reusable UI components
└── lib/                    # Utilities and helpers
```

---

## Database Schema (Supabase)

### Core Tables

1. **users** - User accounts
2. **quotes** - Quote records
3. **quote_items** - Line items in quotes
4. **invoices** - Invoice records
5. **clients** - Client information
6. **webhooks** - Webhook configurations

---

## Page Flow

### 1. Landing Page (`/`)
- Marketing landing page with hero section
- 3D animated floating objects (cube, document, coin, checkmark)
- Feature highlights and pricing
- Login/Register CTAs

### 2. Authentication (`/login`, `/register`)
- Supabase email/password auth
- Password reset flow
- OAuth ready (configured but not enabled)

### 3. Dashboard (`/dashboard`)
- Quote statistics (total, pending, accepted, rejected)
- Recent quotes list
- Conversion analytics (win rate, avg value)
- Quick actions (new quote, new client)
- User tour for first-time users

### 4. Quote Management (`/quote`)
- **New Quote** (`/quote/new`) - Create quote with line items
- **Quote Detail** (`/quote/[id]`) - View, edit, send, track
- **Quote PDF** (`/quote/[id]/pdf`) - Generate PDF
- **Public Quote** (`/q/[token]`) - Client-facing view

### 5. Invoice Management (`/invoice`)
- Convert quote to invoice
- Invoice detail view
- GST-compliant invoices

### 6. Clients (`/clients`)
- Client list with search
- Client history view

### 7. Settings (`/settings`)
- Profile management
- Business logo upload
- Email signature
- Notification preferences

### 8. Templates (`/templates`)
- Pre-built quote templates
- Save custom templates

### 9. Admin Panel (`/admin`)
- Admin login required
- User statistics
- Platform analytics
- System health

---

## Key Features

### Quote Creation
1. Add client details (or select existing)
2. Add line items with description, quantity, rate
3. Apply discounts, taxes (GST)
4. Add terms and conditions
5. Generate PDF or share directly

### Sharing & Tracking
- **WhatsApp Share** - Direct share via WhatsApp API
- **Email** - Send via SMTP
- **Link Share** - Public URL with token
- **Open Tracking** - Track when client views
- **Accept/Reject** - Client can accept or reject online

### Voice Assistant
- AI-powered quote creation via voice
- Located bottom-left of dashboard
- Helps users create quotes conversationally

### Chat Bot
- AI assistant for help
- Located bottom-right of dashboard
- Answers questions about the platform

### Webhooks
- Configure webhooks for quote events
- Events: quote_created, quote_sent, quote_opened, quote_accepted, quote_rejected
- Send data to external services (Zapier, custom integrations)

---

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/callback` | Supabase auth callback |
| `/api/quote-pdf/[id]` | Generate quote PDF |
| `/api/invoice-pdf/[id]` | Generate invoice PDF |
| `/api/send-quote-email` | Send quote via email |
| `/api/public-quote` | Get public quote data |
| `/api/public-quote-action` | Client accept/reject |
| `/api/track` | Track quote opens |
| `/api/webhooks` | CRUD webhooks |
| `/api/webhooks/trigger` | Trigger webhook events |
| `/api/upload-logo` | Upload business logo |
| `/api/create-razorpay-order` | Payment processing |
| `/api/convert-to-invoice` | Convert quote to invoice |
| `/api/cron` | Scheduled tasks |
| `/api/admin/*` | Admin API endpoints |

---

## Component Architecture

### Core Components

1. **Sidebar** - Navigation menu
2. **CommandPalette** - Quick search (Ctrl+K)
3. **VoiceAssistant** - Voice quote creation
4. **ChatBot** - AI help assistant
5. **UserTour** - First-time user onboarding
6. **TemplateGallery** - Quote templates
7. **Toast** - Notifications
8. **ThemeToggle** - Light theme indicator
9. **Breadcrumbs** - Navigation breadcrumb
10. **Skeleton** - Loading states

### Quote Components

1. **QuoteWizard** - Multi-step quote creation
2. **VoiceQuoteWizard** - Voice-based quote creation

---

## Configuration

### Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=Shyam2504
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Supabase Tables (Run in Supabase SQL Editor)

See `supabase/schema.sql` for table definitions.

---

## User Roles

| Role | Access |
|------|--------|
| User | Dashboard, Quotes, Invoices, Clients, Settings |
| Admin | All user access + Admin Panel, Platform stats |

---

## Deployment Checklist

1. ✅ Lint passes (`npm run lint`)
2. ✅ TypeScript compiles (`npx tsc --noEmit`)
3. ✅ Build succeeds (`npm run build`)
4. ✅ Environment variables configured
5. ✅ Supabase tables created
6. ✅ Admin account created
7. ✅ Domain configured (sendquote.in)

---

## Common Tasks

### Add New Quote Template
Edit `/src/components/template-gallery.tsx` - add to DEFAULT_TEMPLATES array

### Add New API Endpoint
Create `/src/app/api/[name]/route.ts`

### Modify Landing Page
Edit `/src/app/page.tsx`

### Add New Component
Create in `/src/components/` and import where needed

---

## Support

- Chat with AI bot on dashboard
- Voice assistant for quick help
- Check `/templates` for examples

---

## Credits

Built with Next.js, Supabase, Tailwind CSS, Framer Motion, and more.