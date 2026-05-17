import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockBuilder(result: any) {
  const builder: any = {}
  builder.select = vi.fn().mockReturnValue(builder)
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

describe('PUT /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not admin', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(false)
    const { PUT } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const res = await PUT(req as any, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('updates coupon successfully', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: { id: '1', active: false }, error: null }))
    const { PUT } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const res = await PUT(req as any, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent coupon', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }))
    const { PUT } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons/999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    const res = await PUT(req as any, { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not admin', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(false)
    const { DELETE } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons/1', { method: 'DELETE' })
    const res = await DELETE(req as any, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('deletes coupon successfully', async () => {
    const { verifyAdmin } = await import('@/lib/admin-auth')
    vi.mocked(verifyAdmin).mockResolvedValue(true)
    const builder: any = {}
    builder.delete = vi.fn().mockReturnValue(builder)
    builder.eq = vi.fn().mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue(builder)
    const { DELETE } = await import('./route')
    const req = new Request('http://localhost/api/admin/coupons/1', { method: 'DELETE' })
    const res = await DELETE(req as any, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
