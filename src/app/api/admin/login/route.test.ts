import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
}

const mockTableBuilder = {
  insert: vi.fn(),
}

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
  }),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4 }),
}))

describe('POST /api/admin/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.ADMIN_EMAIL = 'admin@test.com'
    process.env.ADMIN_PASSWORD = 'secure-password-123'
    mockSupabase.from.mockReturnValue(mockTableBuilder)
    mockTableBuilder.insert.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 503 when admin credentials not configured', async () => {
    delete process.env.ADMIN_EMAIL
    delete process.env.ADMIN_PASSWORD
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'test' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe('Admin credentials not configured')
  })

  it('returns 400 without email', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Email and password required')
  })

  it('returns 400 without password', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Email and password required')
  })

  it('returns 401 for invalid credentials', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@test.com', password: 'wrong' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Invalid credentials')
  })

  it('returns 200 for valid credentials', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'secure-password-123' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('stores session in database', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'secure-password-123' }),
    })
    await POST(req as any)
    expect(mockTableBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        expires_at: expect.any(String),
      })
    )
  })

  it('returns 500 on session creation failure', async () => {
    mockTableBuilder.insert.mockResolvedValue({ error: { message: 'DB error' } })
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'secure-password-123' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Session creation failed')
  })

  it('returns 429 when rate limited', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfter: 900 })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'secure-password-123' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toContain('Too many login attempts')
    expect(json.retryAfter).toBe(900)
  })
})
