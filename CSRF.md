# CSRF Protection

## Approach: Double-Submit Cookie + Origin/Referer Checks

This application uses a **defense-in-depth** strategy for CSRF protection:

1. **Double-Submit Cookie Pattern** (primary)
2. **Origin/Referer Header Validation** (secondary)
3. **Supabase RLS Policies** (data-layer safety net)

## How It Works

### 1. Double-Submit Cookie Pattern

- A CSRF token is generated server-side using `crypto.randomBytes(32)`
- The token is stored in a `__csrf` cookie (not httpOnly, so JS can read it)
- On every state-changing request (POST/PUT/PATCH/DELETE), the client must send the same token in the `X-CSRF-Token` header
- The server verifies that the cookie value matches the header value

**Cookie attributes:**
- `httpOnly: false` — required so JavaScript can read it for the header
- `secure: true` in production (HTTPS only), `false` in development
- `sameSite: strict` — prevents cross-site cookie sending
- `path: /` — available across the entire application
- `maxAge: 86400` (24 hours)

### 2. Origin/Referer Validation

As a secondary check, the server verifies that the `Origin` or `Referer` header matches the application's configured `NEXT_PUBLIC_SITE_URL` (or `localhost:3000` in development).

### 3. RLS Policies (Safety Net)

Even if CSRF protection is bypassed, Supabase Row Level Security policies ensure users can only access their own data.

## Protected Endpoints

All mutating API routes (POST/PUT/PATCH/DELETE) require CSRF verification:

- `/api/clients` (POST, PATCH, DELETE)
- `/api/webhooks` (POST, DELETE)
- `/api/webhooks/trigger` (POST)
- `/api/send-quote-email` (POST)
- `/api/convert-to-invoice` (POST)
- `/api/duplicate-quote` (POST)
- `/api/create-razorpay-order` (POST, PUT)
- `/api/upload-logo` (POST)
- `/api/track` (POST)

### Exempt Endpoints

- **GET routes** — read-only, no CSRF needed
- `/api/webhook` — Razorpay webhook (external service, uses signature verification instead)
- `/api/public-quote-action` — public quote acceptance (uses token-based auth, no session cookies)
- `/api/admin/*` — uses separate admin session with its own CSRF considerations
- `/api/cron` — uses `CRON_SECRET` header for authentication
- `/api/health` — read-only

## Client-Side Usage

The `csrfFetch` helper in `src/lib/csrf-client.ts` automatically attaches the CSRF token:

```typescript
import { csrfFetch } from '@/lib/csrf-client'

const res = await csrfFetch('/api/clients', {
  method: 'POST',
  body: JSON.stringify({ name: 'Acme' }),
})
```

For direct `fetch` calls, manually include the header:

```typescript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('__csrf='))
  ?.split('=')[1]

await fetch('/api/clients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token!,
  },
  body: JSON.stringify({ name: 'Acme' }),
})
```

## Error Responses

CSRF failures return HTTP 403 with a JSON body:

```json
{ "error": "CSRF token missing" }
// or
{ "error": "CSRF token mismatch" }
// or
{ "error": "Request origin not verified" }
```

## Limitations

- The double-submit pattern requires the cookie to be readable by JavaScript (not httpOnly). This is a known trade-off, mitigated by `SameSite=Strict` and Origin checks.
- Direct Supabase client calls from the frontend bypass CSRF but are protected by RLS policies.
- The CSRF token is not bound to the user session — it is a per-browser token. For session-bound CSRF, a server-side token store would be needed (considered overkill for this application's threat model).

## Testing

Run security-focused tests:

```bash
npm test -- --grep "csrf"
```
