import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as supabaseModule from '@/lib/supabase'

vi.mock('@/lib/auth')
vi.mock('@/lib/supabase')

const mockSupabase = {
  from: vi.fn(),
}

const builders: Record<string, any> = {}

function makeRequest(url: string) {
  const urlObj = new URL(url)
  return {
    headers: new Headers(),
    nextUrl: urlObj,
  }
}

describe('GET /api/export-all', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)

    builders.quotes = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    builders.profiles = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    builders.invoices = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    builders.payments = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn(),
    }
    mockSupabase.from.mockImplementation((table: string) => builders[table])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/export-all')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('returns JSON when format=json', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.order.mockResolvedValue({ data: [], error: null })
    builders.profiles.single.mockResolvedValue({ data: { business_name: 'Test' }, error: null })
    builders.invoices.order.mockResolvedValue({ data: [], error: null })
    builders.payments.in.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/export-all?format=json')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.quotes).toEqual([])
    expect(json.invoices).toEqual([])
  })

  it('returns CSV when format=csv', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.order.mockResolvedValue({ data: [], error: null })
    builders.profiles.single.mockResolvedValue({ data: { business_name: 'Test' }, error: null })
    builders.invoices.order.mockResolvedValue({ data: [], error: null })
    builders.payments.in.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/export-all?format=csv')
    const res = await GET(req as any)
    expect(res.headers.get('Content-Type')).toBe('text/csv')
  })

  it('returns ZIP by default', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.order.mockResolvedValue({ data: [], error: null })
    builders.profiles.single.mockResolvedValue({ data: { business_name: 'Test' }, error: null })
    builders.invoices.order.mockResolvedValue({ data: [], error: null })
    builders.payments.in.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/export-all')
    const res = await GET(req as any)
    expect(res.headers.get('Content-Type')).toBe('application/zip')
  })

  it('includes quotes with items', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.order.mockResolvedValue({
      data: [{
        id: 'q-1',
        quote_number: 'QS-001',
        client_name: 'Test Client',
        client_email: 'client@test.com',
        client_phone: '1234567890',
        client_address: '123 Test St',
        status: 'sent',
        subtotal: 1000,
        discount: 0,
        gst_rate: 18,
        total: 1180,
        created_at: '2024-01-01T00:00:00Z',
        valid_until: '2024-02-01T00:00:00Z',
        quote_items: [],
      }],
      error: null,
    })
    builders.profiles.single.mockResolvedValue({ data: { business_name: 'Test' }, error: null })
    builders.invoices.order.mockResolvedValue({ data: [], error: null })
    builders.payments.in.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = makeRequest('http://localhost/api/export-all?format=json')
    const res = await GET(req as any)
    const json = await res.json()
    expect(json.quotes).toHaveLength(1)
    expect(json.quotes[0].quote_number).toBe('QS-001')
  })
})
