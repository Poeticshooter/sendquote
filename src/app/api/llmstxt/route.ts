import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const content = `# SendQuote
> The fastest path from conversation to contract. AI-powered revenue workflow platform.

## What is SendQuote?
SendQuote is an AI-powered quotation and revenue workflow platform that helps businesses generate, negotiate, approve, and close deals in hours instead of weeks. It transforms static quotation PDFs into interactive, trackable buying experiences.

## Capabilities
- AI Quote Generation: Generate complete quotes from a brief description in under 60 seconds
- Interactive Deal Room: Branded, mobile-responsive quote pages with real-time buyer tracking
- Buyer Intent Analytics: Track who opened, what they viewed, and for how long
- In-Quote Negotiation: Buyers can request changes, adjust quantities, and counter-offer
- One-Click E-Signature: Native signature collection without leaving the quote
- Payment Collection: Accept credit cards, UPI, bank transfers (Razorpay + Stripe)
- Approval Workflows: Rule-based routing for discounts and deal approvals
- AI Auto Follow-Ups: Personalized follow-ups triggered by buyer behavior
- CRM Sync: Bi-directional sync with HubSpot, Salesforce, Pipedrive
- Contract Automation: Signed quotes auto-convert to contracts and invoices
- Client Portal: Single view of all quotes, contracts, invoices, payments

## API Endpoints
- POST /api/quotes — Create a new quote
- GET /api/quotes — List quotes
- GET /api/quotes/:id — Get quote details
- POST /api/quotes/:id/send — Send quote via email
- GET /api/invoices — List invoices
- POST /api/clients — Create client
- Webhooks for quote events, payments, subscriptions

## Documentation
- Help Center: https://sendquote.in/docs
- API Reference: https://sendquote.in/docs/api
- Changelog: https://sendquote.in/changelog

## Contact
- Website: https://sendquote.in
- Support: support@sendquote.in`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
