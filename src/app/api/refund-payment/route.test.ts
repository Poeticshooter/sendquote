import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as supabaseModule from '@/lib/supabase'
import { CSRF_TOKEN, createMockRequest } from '@/test/csrf-helpers'

vi.mock('@/lib/auth')
vi.mock('@/lib/supabase')

const mockSupabase = {
  from: vi.fn(),
}

const mockQueryBuilder = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
}

function setupMockQuery() {
  mockQueryBuilder.select.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.single.mockReset()
  mockQueryBuilder.update.mockReturnValue(mockQueryBuilder)
  mockSupabase.from.mockReturnValue(mockQueryBuilder)
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('POST /api/refund-payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    setupMockQuery()
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_key'
    process.env.RAZORPAY_KEY_SECRET = 'test-secret'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/refund-payment', { method: 'POST', body: JSON.stringify({ paymentId: 'pay_123' }) })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 without paymentId', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/refund-payment', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 when payment not found', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('not found') })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/refund-payment', { method: 'POST', body: JSON.stringify({ paymentId: 'pay_123' }) })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
  })

  it('processes refund and cancels subscription', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'sub-1', razorpay_payment_id: 'pay_123', status: 'active', plan_type: 'starter_monthly', user_id: 'u-1' },
      error: null,
    })
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'rf_123' }),
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/refund-payment', { method: 'POST', body: JSON.stringify({ paymentId: 'pay_123' }) })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.refundId).toBe('rf_123')
  })
})
