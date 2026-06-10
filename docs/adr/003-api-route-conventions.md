# ADR 003: API Route Conventions

**Date**: 2026-06-10  
**Status**: Accepted  

## Context

SendQuote has 42 API routes across 29 directories. Consistent conventions reduce bugs, speed up development, and make routes predictable.

## Decision

Every API route follows this exact pattern:

```
Zod Schema → requireAuth() → Handler → Sentry capture → Response
```

### Route File Template

```typescript
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { SomeSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET() {
  try {
    const user = await requireAuth();
    // ... handler logic
    return success(data);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = SomeSchema.parse(body);
    // ... handler logic
    return success(result, 201);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
```

### URL Conventions
- Plural nouns: `/api/quotes`, `/api/clients`, `/api/templates`
- Actions as sub-resources: `/api/quotes/accept`, `/api/quotes/send`
- Webhooks at `/api/webhook/<provider>` (Razorpay, n8n)
- Admin at `/api/admin/*`
- Cron at `/api/expiry/check`, `/api/followup/process`

### Response Format
```typescript
// Success
{ "data": T }

// Error
{ "error": string, "details"?: unknown }
```

### Naming
- GET = list/read
- POST = create or action
- PUT/PATCH = update
- DELETE = remove
- Actions use POST: `/api/quotes/send`, `/api/quotes/accept`
