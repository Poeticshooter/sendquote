import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit, clearRateLimitStore } from './rate-limit'

beforeEach(() => {
  clearRateLimitStore()
})

describe('rateLimit', () => {
  it('allows first request', async () => {
    const result = await rateLimit('1.2.3.4', 'test', 3, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('blocks after max requests', async () => {
    await rateLimit('1.2.3.4', 'test', 2, 60000)
    await rateLimit('1.2.3.4', 'test', 2, 60000)
    const result = await rateLimit('1.2.3.4', 'test', 2, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('tracks different IPs separately', async () => {
    await rateLimit('1.1.1.1', 'test', 1, 60000)
    const result = await rateLimit('2.2.2.2', 'test', 1, 60000)
    expect(result.allowed).toBe(true)
  })

  it('tracks different routes separately', async () => {
    await rateLimit('1.2.3.4', 'route-a', 1, 60000)
    const result = await rateLimit('1.2.3.4', 'route-b', 1, 60000)
    expect(result.allowed).toBe(true)
  })

  it('returns correct remaining count', async () => {
    const r1 = await rateLimit('1.2.3.4', 'test', 5, 60000)
    expect(r1.remaining).toBe(4)
    const r2 = await rateLimit('1.2.3.4', 'test', 5, 60000)
    expect(r2.remaining).toBe(3)
    const r3 = await rateLimit('1.2.3.4', 'test', 5, 60000)
    expect(r3.remaining).toBe(2)
  })

  it('allows request after store is cleared', async () => {
    await rateLimit('1.2.3.4', 'test', 1, 60000)
    const blocked = await rateLimit('1.2.3.4', 'test', 1, 60000)
    expect(blocked.allowed).toBe(false)
    clearRateLimitStore()
    const allowed = await rateLimit('1.2.3.4', 'test', 1, 60000)
    expect(allowed.allowed).toBe(true)
  })
})
