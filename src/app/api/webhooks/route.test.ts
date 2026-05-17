import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@/lib/supabase'
import * as authModule from '@/lib/auth'
import { CSRF_TOKEN, createMockRequest } from '@/test/csrf-helpers'

vi.mock('@/lib/supabase')
vi.mock('@/lib/auth')
vi.mock('dns', () => ({
  default: {
    promises: {
      lookup: vi.fn().mockResolvedValue({ address: '8.8.8.8' }),
    },
  },
  promises: {
    lookup: vi.fn().mockResolvedValue({ address: '8.8.8.8' }),
  },
}))

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('POST /api/webhooks', () => {
  let mockWebhookBuilder: any
  let mockDeleteBuilder: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockDeleteBuilder = { eq: vi.fn().mockImplementation(() => mockDeleteBuilder) }
    mockWebhookBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      delete: vi.fn(() => mockDeleteBuilder),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    mockSupabase.from.mockReturnValue(mockWebhookBuilder)
    mockWebhookBuilder.single.mockResolvedValue({ data: { id: 'wh-1', url: 'https://example.com/webhook' }, error: null })
    mockFetch.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 without URL', async () => {
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: ['quote.sent'] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 403 without CSRF token', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/webhook', events: ['quote.sent'] }),
    })
    ;(req as any).cookies = { get: () => undefined }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 without events', async () => {
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/webhook' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for private IP', async () => {
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://192.168.1.1/webhook', events: ['quote.sent'] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('creates webhook and returns success', async () => {
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/webhook', events: ['quote.sent'] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns warning if test fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/webhook', events: ['quote.sent'] }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})

describe('GET /api/webhooks', () => {
  let mockWebhookBuilder: any
  let mockDeleteBuilder: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockDeleteBuilder = { eq: vi.fn().mockImplementation(() => mockDeleteBuilder) }
    mockWebhookBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      delete: vi.fn(() => mockDeleteBuilder),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
      limit: vi.fn(),
    }
    mockSupabase.from.mockReturnValue(mockWebhookBuilder)
    mockWebhookBuilder.order.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/webhooks')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('returns webhooks list', async () => {
    mockWebhookBuilder.order.mockResolvedValue({
      data: [{ id: 'wh-1', url: 'https://example.com/webhook', events: ['quote.sent'] }],
      error: null,
    })
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/webhooks')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.webhooks).toHaveLength(1)
  })
})

describe('DELETE /api/webhooks', () => {
  let mockDeleteBuilder: any
  let mockWebhookBuilder: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockDeleteBuilder = {
      eq: vi.fn(),
    }
    mockDeleteBuilder.eq.mockImplementation(() => mockDeleteBuilder)
    mockWebhookBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      delete: vi.fn(() => mockDeleteBuilder),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    mockSupabase.from.mockReturnValue(mockWebhookBuilder)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 without id', async () => {
    const { DELETE } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks')
    const res = await DELETE(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { DELETE } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks?id=wh-1')
    const res = await DELETE(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 without CSRF token', async () => {
    const { DELETE } = await import('./route')
    const req = new Request('http://localhost/api/webhooks?id=wh-1')
    ;(req as any).cookies = { get: () => undefined }
    const res = await DELETE(req as any)
    expect(res.status).toBe(403)
  })

  it('deletes webhook', async () => {
    const chainMock = { eq: vi.fn() }
    chainMock.eq.mockReturnValue(chainMock)
    mockWebhookBuilder.delete.mockReturnValue(chainMock)
    mockWebhookBuilder.select.mockReturnThis()
    mockWebhookBuilder.single.mockResolvedValue({ data: { id: 'wh-1' }, error: null })

    const { DELETE } = await import('./route')
    const req = createMockRequest('http://localhost/api/webhooks?id=wh-1')
    const res = await DELETE(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
