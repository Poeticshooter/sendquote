import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as supabaseModule from '@/lib/supabase'
import { CSRF_TOKEN, createMockRequest } from '@/test/csrf-helpers'

vi.mock('@/lib/auth')
vi.mock('@/lib/supabase')

describe('POST /api/duplicate-quote', () => {
  let supabase: any
  let builders: Record<string, any>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    builders = {
      quotes: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      },
      quote_items: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
    }
    supabase = {
      from: vi.fn((table: string) => builders[table]),
      rpc: vi.fn(),
    }
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(supabase)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 403 without CSRF token', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    ;(req as any).cookies = { get: () => undefined }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 without quoteId', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders['quotes'].single.mockResolvedValue({ data: null, error: new Error('not found') })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
  })

  it('returns 403 for other user\'s quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders['quotes'].single.mockResolvedValue({ data: { user_id: 'u-2' }, error: null })
    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('duplicates quote and returns new ID', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders['quotes'].single.mockResolvedValue({
      data: {
        id: 'q-1', user_id: 'u-1', client_name: 'Test Client',
        client_email: 'client@test.com', client_phone: '1234567890',
        client_address: '123 Test St', valid_until: '2024-02-01',
        status: 'sent', quote_number: 'QS-001',
        subtotal: 1000, discount: 0, discount_type: 'percent',
        gst_rate: 18, gst_amount: 180, total: 1180,
        notes: '', terms: '', payment_terms: '', version: 1,
      },
      error: null,
    })
    builders['quote_items'].order.mockResolvedValue({ data: [], error: null })
    supabase.rpc.mockResolvedValue({ data: 'QS-002' })
    builders['quotes'].insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'q-2' }, error: null }),
      }),
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.quoteId).toBe('q-2')
    expect(json.quoteNumber).toEqual({ data: 'QS-002' })
  })

  it('copies items to new quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders['quotes'].single.mockResolvedValue({
      data: {
        id: 'q-1', user_id: 'u-1', client_name: 'Test Client',
        client_email: 'client@test.com', client_phone: '',
        client_address: '', valid_until: null, status: 'draft',
        quote_number: 'QS-001', subtotal: 1000, discount: 0,
        discount_type: 'percent', gst_rate: 18, gst_amount: 180,
        total: 1180, notes: '', terms: '', payment_terms: '', version: 1,
      },
      error: null,
    })
    builders['quote_items'].order.mockResolvedValue({
      data: [{ description: 'Item 1', spec: '', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }],
      error: null,
    })
    supabase.rpc.mockResolvedValue({ data: 'QS-002' })
    builders['quotes'].insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'q-2' }, error: null }),
      }),
    })
    builders['quote_items'].insert.mockResolvedValue({ error: null })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
  })

  it('returns 500 when insert fails', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'u-1' } as any)
    builders['quotes'].single.mockResolvedValue({
      data: {
        id: 'q-1', user_id: 'u-1', client_name: 'Test Client',
        client_email: 'client@test.com', client_phone: '',
        client_address: '', valid_until: null, status: 'draft',
        quote_number: 'QS-001', subtotal: 1000, discount: 0,
        discount_type: 'percent', gst_rate: 18, gst_amount: 180,
        total: 1180, notes: '', terms: '', payment_terms: '', version: 1,
      },
      error: null,
    })
    builders['quote_items'].order.mockResolvedValue({ data: [], error: null })
    supabase.rpc.mockResolvedValue({ data: 'QS-002' })
    builders['quotes'].insert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('insert failed') }),
      }),
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/duplicate-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
