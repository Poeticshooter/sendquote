import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeRequest(url: string, body: string, headers?: Record<string, string>) {
  const urlObj = new URL(url)
  return {
    headers: new Headers(headers || {}),
    nextUrl: urlObj,
    text: () => Promise.resolve(body),
  }
}

function createSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 500 without webhook secret', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET
    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/webhook', '{}')
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('webhook secret not configured')
  })

  it('returns 401 without signature header', async () => {
    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/webhook', '{}')
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('missing signature')
  })

  it('returns 401 for invalid signature', async () => {
    const { POST } = await import('./route')
    const body = JSON.stringify({ event: 'payment.captured' })
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': 'invalid-signature',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('invalid signature')
  })

  it('handles payment.captured event', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_payment_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1', plan_type: 'starter_monthly', billing_cycle: 'monthly' }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'payment.captured', id: 'evt_pay_123',
      payload: { payment: { entity: { id: 'pay_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles subscription.activated event', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_subscription_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1', plan_type: 'pro_monthly', billing_cycle: 'monthly' }]) }
      }
      if (url.includes('profiles') && url.includes('referred_by')) {
        return { ok: true, json: () => Promise.resolve([{ referred_by: null }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'subscription.activated', id: 'evt_sub_act_123',
      payload: { subscription: { entity: { id: 'sub_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles subscription.charged event', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_subscription_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1', plan_type: 'starter_annual', billing_cycle: 'annual' }]) }
      }
      if (url.includes('profiles') && url.includes('referred_by')) {
        return { ok: true, json: () => Promise.resolve([{ referred_by: null }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'subscription.charged', id: 'evt_sub_chg_123',
      payload: { subscription: { entity: { id: 'sub_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles subscription.cancelled event', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_subscription_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'subscription.cancelled', id: 'evt_sub_can_123',
      payload: { subscription: { entity: { id: 'sub_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles subscription.expired event', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_subscription_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'subscription.expired', id: 'evt_sub_exp_123',
      payload: { subscription: { entity: { id: 'sub_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('processes referral on activation', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('subscriptions') && url.includes('razorpay_subscription_id')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1', plan_type: 'starter_monthly', billing_cycle: 'monthly' }]) }
      }
      if (url.includes('profiles') && url.includes('referred_by')) {
        return { ok: true, json: () => Promise.resolve([{ referred_by: 'referrer-1' }]) }
      }
      if (url.includes('referrals')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('profiles') && url.includes('plan_expiry')) {
        return { ok: true, json: () => Promise.resolve([{ plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'subscription.activated', id: 'evt_sub_act_123',
      payload: { subscription: { entity: { id: 'sub_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles missing payload.entity', async () => {
    const { POST } = await import('./route')
    const body = JSON.stringify({ event: 'payment.captured', id: 'evt_pay_123', payload: {} })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('returns 500 on processing failure', async () => {
    mockFetch.mockImplementation(async () => {
      throw new Error('Supabase connection failed')
    })

    const { POST } = await import('./route')
    const body = JSON.stringify({
      event: 'payment.captured', id: 'evt_pay_123',
      payload: { payment: { entity: { id: 'pay_123' } } },
    })
    const sig = createSignature(body, 'test-webhook-secret')
    const req = makeRequest('http://localhost/api/webhook', body, {
      'x-razorpay-signature': sig,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('processing failed')
  })
})
