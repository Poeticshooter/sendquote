# ADR 001: AI Provider Chain Architecture

**Date**: 2026-06-10  
**Status**: Accepted  

## Context

SendQuote generates AI-powered quotes from natural language descriptions. The app needs reliable AI inference without depending on a single provider. Provider outages, rate limits, or API changes must not block users.

## Decision

Use a **fallback chain** pattern with 3 providers in priority order:

1. **Groq** (primary) — fastest inference, 14,400 req/day free tier
2. **OpenRouter** (fallback) — 30+ free models, proxies DeepSeek/OpenAI
3. **Gemini** (last resort) — Google's free tier, 1,500 req/day

### Architecture

```
User Request
  → generateQuoteAI(description)
    → getProviders() → [GroqProvider, OpenRouterProvider, GeminiProvider]
    → generateWithFallback(prompt, system, providers)
      → GroqProvider.generate()  [timeout: 30s]
        → success? Return result
        → fail?   → OpenRouterProvider.generate()  [timeout: 30s]
          → success? Return result
          → fail?   → GeminiProvider.generate()     [timeout: 30s]
            → success? Return result
            → fail?   → Fall back to local templates
```

### Key Properties
- Each provider wraps a single `generate()` method with 30s timeout
- `isAvailable()` checks for API key presence (not a live health check)
- Cache layer via `ai_cache` table keyed by `prompt_hash + system_hash`
- If ALL providers fail, the system returns template-based quotes (degraded mode)

### Caching Strategy
- Cache key = SHA-256 hash of `(prompt + system_prompt)`
- Cache TTL: indefinite (cache busting via prompt changes)
- Cache hit = skip all provider calls entirely
- Cache miss = generate, then cache result asynchronously (fire-and-forget)

### Consequences
- + High availability: 3 providers × 30s timeout = 90s max before template fallback
- + Cost control: caching reduces redundant API calls by ~60%
- - Latency: worst case is 90s before fallback (acceptable for non-real-time)
- - Cache invalidation: prompt changes require manual or automated cache clear
