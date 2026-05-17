import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@/lib/supabase'
import { CSRF_TOKEN } from '@/test/csrf-helpers'

vi.mock('@/lib/supabase')

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

const mockProfileBuilder = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn(),
}

const mockSubscriptionBuilder = {
  insert: vi.fn(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn(),
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeRequest(url: string, method: string, body?: any, headers?: Record<string, string>) {
  const urlObj = new URL(url)
  const token = CSRF_TOKEN
  return {
    headers: new Headers({ ...headers, cookie: `__csrf=${token}`, 'x-csrf-token': token, origin: 'http://localhost:3000' }),
    nextUrl: urlObj,
    cookies: { getAll: () => [{ name: '__csrf', value: token }], get: (name: string) => name === '__csrf' ? { value: token } : undefined, setAll: () => {} },
    json: () => Promise.resolve(body || {}),
  }
}

describe('POST /api/create-razorpay-order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key'
    process.env.RAZORPAY_KEY_SECRET = 'test-secret'
    mockSupabase.from.mockReturnValue(mockSubscriptionBuilder)
    mockSubscriptionBuilder.insert.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('unauthorized') })
    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', {}, {})
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 without CSRF token', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const { POST } = await import('./route')
    const req = {
      headers: new Headers({ Authorization: 'Bearer token' }),
      nextUrl: new URL('http://localhost/api/create-razorpay-order'),
      cookies: { getAll: () => [], get: () => undefined, setAll: () => {} },
      json: () => Promise.resolve({ planType: 'starter_monthly' }),
    }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('creates order with correct amount', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order_123', amount: 29900, currency: 'INR' }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'starter_monthly' }, { Authorization: 'Bearer token' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('order_123')
  })

  it('computes 18% GST correctly', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order_123' }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'starter_monthly' }, { Authorization: 'Bearer token' })
    await POST(req as any)
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.amount).toBe(35300)
  })

  it('computes 10% annual discount', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order_123' }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'starter_annual', billingCycle: 'annual' }, { Authorization: 'Bearer token' })
    await POST(req as any)
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.amount).toBe(381000)
  })

  it('handles unknown plan → defaults starter', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order_123' }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'unknown_monthly' }, { Authorization: 'Bearer token' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })

  it('inserts subscription record', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'order_123' }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'starter_monthly' }, { Authorization: 'Bearer token' })
    await POST(req as any)
    expect(mockSubscriptionBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u-1',
        razorpay_order_id: 'order_123',
        plan_type: 'starter_monthly',
        status: 'inactive',
      })
    )
  })

  it('returns 400 on Razorpay failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { description: 'Invalid key' } }),
    })

    const { POST } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'POST', { planType: 'starter_monthly' }, { Authorization: 'Bearer token' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/create-razorpay-order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key'
    process.env.RAZORPAY_KEY_SECRET = 'test-secret'
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'subscriptions') return mockSubscriptionBuilder
      return mockProfileBuilder
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 without paymentId', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const { PUT } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'PUT', { orderId: 'order_123', signature: 'sig' }, { Authorization: 'Bearer token' })
    const res = await PUT(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid signature', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const crypto = await import('crypto')
    const validSig = crypto.createHmac('sha256', 'test-secret').update('order_123|pay_123').digest('hex')
    const invalidSig = validSig.split('').map(c => c === 'a' ? 'b' : 'a').join('')
    const { PUT } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'PUT', {
      paymentId: 'pay_123',
      orderId: 'order_123',
      signature: invalidSig,
    }, { Authorization: 'Bearer token' })
    const res = await PUT(req as any)
    expect(res.status).toBe(400)
  })

  it('updates subscription to active', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const crypto = await import('crypto')
    const validSig = crypto.createHmac('sha256', 'test-secret').update('order_123|pay_123').digest('hex')
    const { PUT } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'PUT', {
      paymentId: 'pay_123',
      orderId: 'order_123',
      signature: validSig,
      planType: 'starter_monthly',
    }, { Authorization: 'Bearer token' })
    const res = await PUT(req as any)
    expect(res.status).toBe(200)
    expect(mockSubscriptionBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        razorpay_payment_id: 'pay_123',
        status: 'active',
      })
    )
  })

  it('sets correct period end', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const crypto = await import('crypto')
    const validSig = crypto.createHmac('sha256', 'test-secret').update('order_123|pay_123').digest('hex')
    const { PUT } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'PUT', {
      paymentId: 'pay_123',
      orderId: 'order_123',
      signature: validSig,
      planType: 'starter_monthly',
      billingCycle: 'monthly',
    }, { Authorization: 'Bearer token' })
    await PUT(req as any)
    expect(mockSubscriptionBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_end: expect.any(String),
      })
    )
  })

  it('returns 401 without auth', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('unauthorized') })
    const { PUT } = await import('./route')
    const req = makeRequest('http://localhost/api/create-razorpay-order', 'PUT', {
      paymentId: 'pay_123',
      orderId: 'order_123',
      signature: 'sig',
    })
    const res = await PUT(req as any)
    expect(res.status).toBe(401)
  })
})
