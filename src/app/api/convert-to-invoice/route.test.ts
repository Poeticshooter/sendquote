import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as rateLimitModule from '@/lib/rate-limit'
import * as supabaseModule from '@/lib/supabase'
import * as activityModule from '@/lib/activity'
import { CSRF_TOKEN, createMockRequest } from '@/test/csrf-helpers'

vi.mock('@/lib/auth')
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/supabase')
vi.mock('@/lib/activity')

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

describe('POST /api/convert-to-invoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    vi.mocked(rateLimitModule.rateLimit).mockReset().mockResolvedValue({ allowed: true, remaining: 19 })
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    vi.mocked(activityModule.logActivity).mockResolvedValue(undefined)
    mockSupabase.from.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.single.mockReset()
    mockSupabase.rpc.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 without CSRF token', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    ;(req as any).cookies = { get: () => undefined }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 without quoteId', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
  })

  it('returns 403 for other user\'s quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: { user_id: 'u-2', quote_number: 'QS-001' }, error: null })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('creates invoice and returns invoiceId', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: { user_id: 'u-1', quote_number: 'QS-001' }, error: null })
    mockSupabase.rpc.mockResolvedValue({ data: 'inv-123' })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.invoiceId).toBe('inv-123')
  })

  it('logs activity', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: { user_id: 'u-1', quote_number: 'QS-001' }, error: null })
    mockSupabase.rpc.mockResolvedValue({ data: 'inv-123' })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    await POST(req as any)
    expect(vi.mocked(activityModule.logActivity)).toHaveBeenCalledTimes(2)
  })

  it('returns 500 when RPC fails', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    mockQueryBuilder.single.mockResolvedValue({ data: { user_id: 'u-1', quote_number: 'QS-001' }, error: null })
    mockSupabase.rpc.mockResolvedValue({ data: null })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/convert-to-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
