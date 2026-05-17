import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as supabaseModule from '@/lib/supabase'
import * as pdfModule from '@/lib/pdf'

vi.mock('@/lib/auth')
vi.mock('@/lib/supabase')
vi.mock('@/lib/pdf')

const mockSupabase = {
  from: vi.fn(),
}

const builders: Record<string, any> = {}

describe('GET /api/quote-pdf/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    vi.mocked(pdfModule.generateQuotePDF).mockResolvedValue(new Uint8Array([1, 2, 3]))

    builders.quotes = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    builders.profiles = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }
    builders.quote_items = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    mockSupabase.from.mockImplementation((table: string) => builders[table])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quote-pdf/q-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'q-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.single.mockResolvedValue({ data: null, error: new Error('not found') })
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quote-pdf/q-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'q-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 for other user\'s quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.single.mockResolvedValue({ data: { user_id: 'u-2' }, error: null })
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quote-pdf/q-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'q-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns PDF with correct headers', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.single.mockResolvedValue({
      data: {
        id: 'q-1',
        user_id: 'u-1',
        quote_number: 'QS-001',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        valid_until: '2024-02-01T00:00:00Z',
        client_name: 'Test Client',
        client_address: '',
        client_phone: '',
        client_email: '',
        subtotal: 1000,
        discount: 0,
        discount_type: 'percent',
        gst_rate: 18,
        gst_amount: 180,
        total: 1180,
        terms: '',
        notes: '',
        payment_terms: '',
      },
      error: null,
    })
    builders.profiles.single.mockResolvedValue({ data: { business_name: 'Test Business', plan: 'starter' }, error: null })
    builders.quote_items.order.mockResolvedValue({ data: [], error: null })

    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quote-pdf/q-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'q-1' }) })
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('quote-QS-001.pdf')
  })

  it('returns 500 on error', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders.quotes.single.mockRejectedValue(new Error('DB error'))
    const { GET } = await import('./route')
    const req = new Request('http://localhost/api/quote-pdf/q-1')
    const res = await GET(req as any, { params: Promise.resolve({ id: 'q-1' }) })
    expect(res.status).toBe(500)
  })
})
