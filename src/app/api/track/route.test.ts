import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as rateLimitModule from '@/lib/rate-limit'
import * as supabaseModule from '@/lib/supabase'
import * as activityModule from '@/lib/activity'

vi.mock('@/lib/rate-limit')
vi.mock('@/lib/supabase')
vi.mock('@/lib/activity')

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: any, init?: { status?: number; headers?: Record<string, string> }) => ({
      status: init?.status || 200,
      body,
      headers: new Headers(init?.headers),
    }),
  },
}))

const mockSupabase = {
  from: vi.fn(),
}

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn().mockReturnThis(),
}

function makeRequest(url: string, headers?: Record<string, string>) {
  const urlObj = new URL(url)
  return {
    headers: new Headers(headers || {}),
    nextUrl: urlObj,
  }
}

describe('GET /api/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rateLimitModule.rateLimit).mockReset().mockResolvedValue({ allowed: true, remaining: 99 })
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    vi.mocked(activityModule.logActivity).mockResolvedValue(undefined)
    mockSupabase.from.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.single.mockReset()
    mockQueryBuilder.insert.mockReset()
    mockQueryBuilder.update.mockReturnThis()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 204 without token', async () => {
    vi.doUnmock('next/server')
    vi.doMock('next/server', () => ({
      NextRequest: class {},
      NextResponse: class NextResponse {
        static json(body: any, init?: { status?: number; headers?: Record<string, string> }) {
          return { status: init?.status || 200, body, headers: new Headers(init?.headers) }
        }
        constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
          ;(this as any).status = init?.status || 200
          ;(this as any).body = body
          ;(this as any).headers = new Headers(init?.headers)
        }
      },
    }))

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track')
    const res = await GET(req as any)
    expect(res.status).toBe(204)
  })

  it('records opened event', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-1', status: 'sent' },
      error: null,
    })
    mockQueryBuilder.insert.mockResolvedValue({ error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token')
    const res = await GET(req as any)

    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      quote_id: 'q-1',
      event_type: 'opened',
      device_type: 'unknown',
    })
    expect(res.status).toBe(200)
  })

  it('updates sent→opened', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-1', status: 'sent' },
      error: null,
    })
    mockQueryBuilder.insert.mockResolvedValue({ error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token')
    await GET(req as any)

    expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'opened' })
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'q-1')
  })

  it('does not change already opened', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-1', status: 'opened' },
      error: null,
    })
    mockQueryBuilder.insert.mockResolvedValue({ error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token')
    await GET(req as any)

    expect(mockQueryBuilder.update).not.toHaveBeenCalled()
  })

  it('logs activity with IP', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-1', status: 'sent' },
      error: null,
    })
    mockQueryBuilder.insert.mockResolvedValue({ error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token', { 'x-forwarded-for': '1.2.3.4' })
    await GET(req as any)

    expect(vi.mocked(activityModule.logActivity)).toHaveBeenCalledWith(
      'user-1',
      'quote',
      'q-1',
      'quote_opened',
      expect.objectContaining({ ip: '1.2.3.4' })
    )
  })

  it('returns 1x1 GIF', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token')
    const res = await GET(req as any)

    expect(res.headers.get('Content-Type')).toBe('image/gif')
  })

  it('handles non-existent token silently', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=nonexistent')
    const res = await GET(req as any)

    expect(res.status).toBe(200)
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled()
  })

  it('returns 429 after rate limit exceeded', async () => {
    vi.mocked(rateLimitModule.rateLimit).mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 30 })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/track?token=valid-token')
    const res = await GET(req as any)
    expect(res.status).toBe(429)
  })
})
