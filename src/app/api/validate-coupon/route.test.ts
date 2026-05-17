import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAuthSupabase = {
  auth: { getUser: vi.fn() },
}

function createAdminMockBuilder(result: any, isCountQuery = false) {
  const builder: any = {}
  builder.select = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(isCountQuery ? Promise.resolve(result) : builder)
  builder.single = vi.fn().mockResolvedValue(result)
  return builder
}

const mockAdminSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockAuthSupabase),
}))

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}))

describe('POST /api/validate-coupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 without required fields', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns invalid for non-existent coupon', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockAdminSupabase.from.mockReturnValue(createAdminMockBuilder({ data: null }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALID', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })

  it('returns valid for active coupon', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    const couponResult = { data: { id: 'c1', code: 'TEST100', discount_type: 'percentage', discount_value: 100, applies_to: 'all_plans', billing_cycle: 'both', max_uses: null, used_count: 0, expires_at: null } }
    const usageResult = { count: 0 }
    let callCount = 0
    mockAdminSupabase.from.mockImplementation(() => {
      callCount++
      return createAdminMockBuilder(callCount === 1 ? couponResult : usageResult)
    })
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TEST100', plan: 'starter', billing_cycle: 'monthly' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.discount_value).toBe(100)
  })

  it('returns invalid for expired coupon', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockAdminSupabase.from.mockReturnValue(createAdminMockBuilder({ data: { id: 'c1', code: 'EXPIRED', expires_at: '2020-01-01', active: true } }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'EXPIRED', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })

  it('returns invalid when usage limit reached', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockAdminSupabase.from.mockReturnValue(createAdminMockBuilder({ data: { id: 'c1', code: 'LIMITED', max_uses: 5, used_count: 5, active: true, expires_at: null } }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'LIMITED', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })

  it('returns invalid for wrong plan', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    mockAdminSupabase.from.mockReturnValue(createAdminMockBuilder({ data: { id: 'c1', code: 'PROONLY', applies_to: 'professional', active: true, expires_at: null, max_uses: null, used_count: 0 } }))
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'PROONLY', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })

  it('returns invalid when user already used coupon', async () => {
    mockAuthSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    const couponBuilder: any = {}
    couponBuilder.select = vi.fn().mockReturnValue(couponBuilder)
    couponBuilder.eq = vi.fn().mockReturnValue(couponBuilder)
    couponBuilder.single = vi.fn().mockResolvedValue({ data: { id: 'c1', code: 'ONCE', applies_to: 'all_plans', active: true, expires_at: null, max_uses: null, used_count: 0 } })
    
    const usageBuilder: any = {}
    usageBuilder.select = vi.fn().mockReturnValue(usageBuilder)
    let eqCallCount = 0
    usageBuilder.eq = vi.fn().mockImplementation(() => {
      eqCallCount++
      if (eqCallCount >= 2) {
        return Promise.resolve({ count: 1 })
      }
      return usageBuilder
    })
    
    let callCount = 0
    mockAdminSupabase.from.mockImplementation(() => {
      callCount++
      return callCount === 1 ? couponBuilder : usageBuilder
    })
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'ONCE', plan: 'starter' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(false)
  })
})
