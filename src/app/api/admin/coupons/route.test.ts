import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockBuilder(result: any) {
  const builder: any = {}
  builder.select = vi.fn().mockReturnValue(builder)
  builder.order = vi.fn().mockReturnValue(Promise.resolve(result))
  builder.insert = vi.fn().mockReturnValue(builder)
  builder.update = vi.fn().mockReturnValue(builder)
  builder.delete = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn().mockResolvedValue(result)
  return builder
}

const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/admin-auth', () => ({
  verifyAdmin: vi.fn(),
}))

describe('GET /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not admin', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(false)
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns coupons when admin', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: [{ id: '1', code: 'TEST100' }], error: null }))
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.coupons).toHaveLength(1)
  })

  it('returns 500 on database error', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: { message: 'DB error' } }))
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('POST /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not admin', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(false)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST', discount_type: 'percentage', discount_value: 10 }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 without required fields', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid discount type', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST', discount_type: 'invalid', discount_value: 10 }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for percentage > 100', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST', discount_type: 'percentage', discount_value: 150 }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('creates coupon successfully', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: { id: '1', code: 'TEST100' }, error: null }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'test100', discount_type: 'percentage', discount_value: 100 }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.coupon.code).toBe('TEST100')
  })

  it('returns 409 for duplicate code', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: { code: '23505', message: 'duplicate' } }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'EXISTING', discount_type: 'fixed', discount_value: 500 }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)
  })
})
