# ADR 002: Rate Limiting Strategy

**Date**: 2026-06-10  
**Status**: Accepted  

## Context

SendQuote operates on Vercel serverless infrastructure where cold starts and ephemeral memory are constraints. The app needs to protect API endpoints from abuse while maintaining low latency.

## Decision

Use **two-tier rate limiting** with database-backed as primary and in-memory as fallback:

### Tier 1: Database-backed (primary)

- A `rate_limits` table in PostgreSQL with key, count, window_start, window_end columns
- Atomic `increment_rate_limit(p_key, p_max_requests, p_window_ms)` RPC uses PostgreSQL to enforce limits without race conditions
- Keys are IP-based format: `rl:<ip_address>`
- Default: 100 requests per 60-second window per IP

### Tier 2: In-memory (fallback)

- `checkMemoryRateLimit()` in `src/lib/rate-limit.ts` uses a shared `Map` with expiry cleanup
- Activated only when the database RPC fails (network issue, cold start race)
- Same limits as DB tier

### Implementation

```typescript
// In middleware.ts and individual routes
export async function rateLimitCheck(request: NextRequest): Promise<boolean> {
  const ip = getClientIp(request);
  try {
    const { data } = await supabase.rpc("increment_rate_limit", {
      p_key: `rl:${ip}`,
      p_max_requests: 100,
      p_window_ms: 60000,
    });
    return data?.[0]?.allowed ?? false;
  } catch {
    return checkMemoryRateLimit(`rl:${ip}`, 100, 60000);
  }
}
```

### Scoped Rate Limits (future)

| Scope | Limit | Window | Applied At |
|-------|-------|--------|------------|
| Global per-IP | 100 | 60s | Middleware |
| AI generation per-user | 20 | 60s | `/api/ai/*` |
| Auth (login/signup) per-IP | 10 | 60s | `/api/auth/*` |
| Webhook (Razorpay) | None | — | Bypasses middleware |

### Consequences
- + Atomic increment prevents race conditions (no read-then-write)
- + DB-backed counters survive cold starts
- + Memory fallback ensures rate limiting never blocks legit traffic due to DB issues
- - DB calls add ~5-10ms latency per request
- - Cleanup job needed for old rate_limit rows
