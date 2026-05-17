import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'user@test.com' } }, error: null }),
      },
    },
  }),
}))

vi.mock('@/lib/email', () => ({
  remindFollowUp: vi.fn().mockResolvedValue(undefined),
  remindAfterOpen: vi.fn().mockResolvedValue(undefined),
  remindExpiry: vi.fn().mockResolvedValue(undefined),
}))

function makeRequest(url: string, headers?: Record<string, string>) {
  const urlObj = new URL(url)
  return {
    headers: new Headers(headers || {}),
    nextUrl: urlObj,
  }
}

describe('GET /api/cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.CRON_SECRET = 'test-cron-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without secret', async () => {
    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('unauthorized')
  })

  it('returns 401 with wrong secret', async () => {
    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=wrong-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('unauthorized')
  })

  it('processes follow-up reminders', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'q-1', quote_number: 'QS-001', client_name: 'Test', user_id: 'u-1' }]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('profiles')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      if (url.includes('auth/v1/admin/users')) {
        return { ok: true, json: () => Promise.resolve({ email: 'user@test.com' }) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.results.length).toBeGreaterThan(0)
  })

  it('skips already reminded (idempotent)', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'q-1', quote_number: 'QS-001', client_name: 'Test', user_id: 'u-1' }]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'r-1' }]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('processes after-open reminders', async () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'q-1', quote_number: 'QS-001', client_name: 'Test', user_id: 'u-1' }]) }
      }
      if (url.includes('quote_events')) {
        return { ok: true, json: () => Promise.resolve([{ created_at: yesterday }]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('profiles')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      if (url.includes('auth/v1/admin/users')) {
        return { ok: true, json: () => Promise.resolve({ email: 'user@test.com' }) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('processes expiry warnings', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes(`valid_until=eq.${tomorrow}`)) {
        return { ok: true, json: () => Promise.resolve([{ id: 'q-1', quote_number: 'QS-001', client_name: 'Test', user_id: 'u-1' }]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('profiles')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      if (url.includes('auth/v1/admin/users')) {
        return { ok: true, json: () => Promise.resolve({ email: 'user@test.com' }) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('auto-expires past-due quotes', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent') && url.includes('created_at=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt') && !url.includes('PATCH')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('PATCH')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'q-1' }]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Expired'))).toBe(true)
  })

  it('processes overdue invoices', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([{ id: 'inv-1', invoice_number: 'INV-001', client_name: 'Test', user_id: 'u-1', total: 1000 }]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('profiles')) {
        return { ok: true, json: () => Promise.resolve([{ user_id: 'u-1' }]) }
      }
      if (url.includes('auth/v1/admin/users')) {
        return { ok: true, json: () => Promise.resolve({ email: 'user@test.com' }) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('archives quote_events >90d', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quote_events') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Archived quote_events'))).toBe(true)
  })

  it('prunes activity_logs >30d', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quote_events') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('activity_logs') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Pruned activity_logs'))).toBe(true)
  })

  it('cleans expired admin sessions', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quote_events') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('activity_logs') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cleanup_expired_admin_sessions')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Cleaned expired admin sessions'))).toBe(true)
  })

  it('purges soft-deleted quotes >24h', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quote_events') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('activity_logs') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cleanup_expired_admin_sessions')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('purge_soft_deleted_quotes')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Purged soft-deleted'))).toBe(true)
  })

  it('downgrades expired plans', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('quotes') && url.includes('status=eq.sent')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('status=eq.opened')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quotes') && url.includes('valid_until=lt')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('invoices')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cron_reminders')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('quote_events') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('activity_logs') && url.includes('DELETE')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('cleanup_expired_admin_sessions')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('purge_soft_deleted_quotes')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      if (url.includes('downgrade_expired_plans')) {
        return { ok: true, json: () => Promise.resolve([]) }
      }
      return { ok: true, json: () => Promise.resolve([]) }
    })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results.some((r: string) => r.includes('Downgraded expired plans'))).toBe(true)
  })

  it('returns results array', async () => {
    mockFetch.mockImplementation(async () => ({ ok: true, json: () => Promise.resolve([]) }))

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(Array.isArray(json.results)).toBe(true)
  })

  it('handles Supabase failures gracefully', async () => {
    mockFetch.mockImplementation(async () => ({ ok: false, status: 500, json: () => Promise.resolve([]) }))

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/cron?secret=test-cron-secret')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})
