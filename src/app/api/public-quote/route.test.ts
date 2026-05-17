import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as rateLimitModule from '@/lib/rate-limit'
import * as supabaseModule from '@/lib/supabase'

vi.mock('@/lib/rate-limit')
vi.mock('@/lib/supabase')

const mockSupabase = {
  from: vi.fn(),
}

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn(),
}

function makeRequest(url: string) {
  const urlObj = new URL(url)
  return {
    headers: new Headers(),
    nextUrl: urlObj,
  }
}

describe('GET /api/public-quote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rateLimitModule.rateLimit).mockReset().mockResolvedValue({ allowed: true, remaining: 59 })
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockSupabase.from.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 without token', async () => {
    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote')
    const res = await GET(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('missing token')
  })

  it('returns 404 for non-existent token', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: new Error('not found') })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=invalid')
    const res = await GET(req as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('not found')
  })

  it('returns 200 with quote+profile+items', async () => {
    let callCount = 0
    mockQueryBuilder.single.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            unique_token: 'valid-token',
            client_name: 'Test Client',
            client_email: 'client@test.com',
            status: 'sent',
            quote_number: 'QS-001',
            subtotal: 1000,
            total: 1180,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }
      }
      return {
        data: {
          business_name: 'Test Business',
          logo_url: 'https://example.com/logo.png',
          phone: '1234567890',
          gst_number: '22AAAAA0000A1Z5',
          address: '123 Test St',
          upi_id: 'test@upi',
        },
        error: null,
      }
    })
    mockQueryBuilder.order.mockResolvedValue({
      data: [{ description: 'Item 1', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }],
      error: null,
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.client_name).toBe('Test Client')
    expect(json.business_name).toBe('Test Business')
    expect(json.items).toHaveLength(1)
  })

  it('returns Cache-Control header', async () => {
    let callCount = 0
    mockQueryBuilder.single.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            unique_token: 'valid-token',
            client_name: 'Test Client',
            status: 'sent',
            quote_number: 'QS-001',
            subtotal: 1000,
            total: 1180,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockQueryBuilder.order.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300, stale-while-revalidate=600')
  })

  it('returns X-Frame-Options: DENY', async () => {
    let callCount = 0
    mockQueryBuilder.single.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            unique_token: 'valid-token',
            client_name: 'Test Client',
            status: 'sent',
            quote_number: 'QS-001',
            subtotal: 1000,
            total: 1180,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockQueryBuilder.order.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('handles missing profile', async () => {
    let callCount = 0
    mockQueryBuilder.single.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            unique_token: 'valid-token',
            client_name: 'Test Client',
            status: 'sent',
            quote_number: 'QS-001',
            subtotal: 1000,
            total: 1180,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockQueryBuilder.order.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.business_name).toBe('')
    expect(json.logo_url).toBe('')
  })

  it('handles missing items', async () => {
    let callCount = 0
    mockQueryBuilder.single.mockImplementation(async () => {
      callCount++
      if (callCount === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            unique_token: 'valid-token',
            client_name: 'Test Client',
            status: 'sent',
            quote_number: 'QS-001',
            subtotal: 1000,
            total: 1180,
            created_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockQueryBuilder.order.mockResolvedValue({ data: null, error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toEqual([])
  })

  it('returns 429 after rate limit exceeded', async () => {
    vi.mocked(rateLimitModule.rateLimit).mockResolvedValue({ allowed: false, remaining: 0, retryAfter: 30 })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/public-quote?token=valid-token')
    const res = await GET(req as any)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toBe('Too many requests')
  })
})
