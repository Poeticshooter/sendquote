# Customer Journey Validation

## Seller Journey

| Step | Files Involved | Status | Notes |
|---|---|---|---|
| Signup | `signup/page.tsx`, `auth/callback/route.ts` | ✅ | Verified in auth-validation |
| Onboarding | `onboarding/page.tsx`, `auth/signup-profile/route.ts` | ✅ | Profile update via API |
| Dashboard load | `dashboard/page.tsx` | ✅ | Fetches profile + quotes |
| Create quote | `quotes/new/page.tsx`, `POST /api/quotes` | ✅ | Zod validated, plan-gated |
| AI generate | `quotes/new/page.tsx`, `POST /api/ai/generate` | ✅ | Template fallback if no AI key |
| Send quote | `quotes/[id]/page.tsx`, `POST /api/quotes/send` | ✅ | Sends email, schedules follow-ups |
| WhatsApp share | `share.ts` | ✅ | Generates wa.me URL |

## Buyer Journey

| Step | Files Involved | Status | Notes |
|---|---|---|---|
| View quote | `q/[token]/page.tsx` | ✅ | Public route, no auth needed |
| Track event | `POST /api/events` | ✅ | Requires auth (seller), changes status to "opened" |
| Chat | `POST /api/chat/buyer` | ✅ | Public token, no auth, self-reported name |
| Accept quote | `POST /api/quotes/accept` | ✅ | Public token, creates invoice |
| Pay | `POST /api/payments/razorpay` | ✅ | Requires seller auth, creates Razorpay order |

## Critical Gaps

### GAP J-001: Buyer events cannot fire without auth
**Severity**: P1  
**File**: `events/route.ts:25` — calls `requireAuth()`  
The events endpoint requires the caller to be a logged-in user. But buyer events (viewed, pricing_viewed) need to fire when an unauthenticated buyer views the quote. This means buyer views are NEVER tracked unless the buyer happens to be a SendQuote user.

**Impact**: "opened" status transition never happens for buyer views. Seller analytics show zero views.

### GAP J-002: No acceptance notification to seller
**Severity**: P1  
**File**: `accept/route.ts` — no email sent, no push notification  
Seller must manually refresh the dashboard to discover accepted deals.

### GAP J-003: Payment initiates but no UI confirmation
**Severity**: P2  
**File**: `payments/razorpay/route.ts` — creates Razorpay order, returns order ID  
The buyer-side payment flow (Razorpay checkout) is handled in a client component. The webhook asynchronously updates the invoice status. There's no real-time feedback to the buyer that payment was received.

## Result
**Core journey: Functional. Three UX/reliability gaps identified. None are launch-blocking for first 10 customers.**
