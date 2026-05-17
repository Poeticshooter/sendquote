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
  order: vi.fn(),
  limit: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
}

function setupMockQuery() {
  mockQueryBuilder.select.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.order.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder)
  mockQueryBuilder.single.mockReset()
  mockQueryBuilder.update.mockReturnValue(mockQueryBuilder)
  mockSupabase.from.mockReturnValue(mockQueryBuilder)
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('POST /api/cancel-subscription', () => {
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
    const req = createMockRequest('http://localhost/api/cancel-subscription', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 without CSRF token', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/cancel-subscription', { method: 'POST', body: JSON.stringify({}) })
    ;(req as any).cookies = { get: () => undefined }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 404 when no active subscription', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('not found') })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/cancel-subscription', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
  })

  it('cancels subscription and retains access until period end', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'sub-1', status: 'active', razorpay_order_id: null, razorpay_subscription_id: null, plan_type: 'starter_monthly', current_period_end: '2025-02-01T00:00:00Z' },
      error: null,
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/cancel-subscription', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.accessUntil).toBe('2025-02-01T00:00:00Z')
  })
})
