import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authModule from '@/lib/auth'
import * as rateLimitModule from '@/lib/rate-limit'
import * as supabaseModule from '@/lib/supabase'
import * as emailModule from '@/lib/email'
import * as pdfModule from '@/lib/pdf'
import * as activityModule from '@/lib/activity'
import { CSRF_TOKEN, createMockRequest } from '@/test/csrf-helpers'

vi.mock('@/lib/auth')
vi.mock('@/lib/rate-limit')
vi.mock('@/lib/supabase')
vi.mock('@/lib/email')
vi.mock('@/lib/pdf')
vi.mock('@/lib/activity')

const mockSupabase = {
  rpc: vi.fn(),
}

describe('POST /api/send-quote-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authModule.getUser).mockReset()
    vi.mocked(rateLimitModule.rateLimit).mockReset().mockResolvedValue({ allowed: true, remaining: 9 })
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    vi.mocked(pdfModule.generateQuotePDF).mockResolvedValue(new Uint8Array([1, 2, 3]))
    vi.mocked(emailModule.sendEmail).mockResolvedValue(undefined)
    vi.mocked(activityModule.logActivity).mockResolvedValue(undefined)
    mockSupabase.rpc.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue(null)

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'test' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 without CSRF token', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'test' }),
    })
    ;(req as any).cookies = { get: () => undefined }
    const res = await POST(req as any)
    expect(res.status).toBe(403)
  })

  it('returns 400 without quoteId', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('quoteId')
  })

  it('returns 404 for non-existent quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'nonexistent' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Quote not found')
  })

  it('returns 403 for other user\'s quote', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-2', client_email: 'client@test.com' },
      error: null,
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns 400 when client_email empty', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockResolvedValue({
      data: { id: 'q-1', user_id: 'user-1', client_email: '' },
      error: null,
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('No client email')
  })

  it('generates PDF and returns ok', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'get_quote_admin') {
        return {
          data: {
            id: 'q-1', user_id: 'user-1', client_email: 'client@test.com',
            client_name: 'Test Client', client_address: '123 Test St',
            client_phone: '1234567890', quote_number: 'QS-001',
            unique_token: 'token-123', status: 'draft',
            created_at: '2024-01-01T00:00:00Z', valid_until: '2024-02-01T00:00:00Z',
            subtotal: 1000, discount: 0, discount_type: 'percent',
            gst_rate: 18, gst_amount: 180, total: 1180,
            terms: '', notes: '', payment_terms: '',
          },
          error: null,
        }
      }
      if (name === 'get_profile_admin') return { data: { business_name: 'Test Business' }, error: null }
      if (name === 'get_quote_items') return { data: [{ description: 'Item 1', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }], error: null }
      return { data: null, error: null }
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles itemsRaw as JSON string', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'get_quote_admin') {
        return {
          data: {
            id: 'q-1', user_id: 'user-1', client_email: 'client@test.com',
            client_name: 'Test Client', quote_number: 'QS-001',
            unique_token: 'token-123', status: 'draft',
            created_at: '2024-01-01T00:00:00Z', valid_until: '2024-02-01T00:00:00Z',
            subtotal: 1000, discount: 0, discount_type: 'percent',
            gst_rate: 18, gst_amount: 180, total: 1180,
            terms: '', notes: '', payment_terms: '',
          },
          error: null,
        }
      }
      if (name === 'get_profile_admin') return { data: { business_name: 'Test Business' }, error: null }
      if (name === 'get_quote_items') return { data: JSON.stringify([{ description: 'Item 1', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }]), error: null }
      return { data: null, error: null }
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles itemsRaw as array', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'get_quote_admin') {
        return {
          data: {
            id: 'q-1', user_id: 'user-1', client_email: 'client@test.com',
            client_name: 'Test Client', quote_number: 'QS-001',
            unique_token: 'token-123', status: 'draft',
            created_at: '2024-01-01T00:00:00Z', valid_until: '2024-02-01T00:00:00Z',
            subtotal: 1000, discount: 0, discount_type: 'percent',
            gst_rate: 18, gst_amount: 180, total: 1180,
            terms: '', notes: '', payment_terms: '',
          },
          error: null,
        }
      }
      if (name === 'get_profile_admin') return { data: { business_name: 'Test Business' }, error: null }
      if (name === 'get_quote_items') return { data: [{ description: 'Item 1', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }], error: null }
      return { data: null, error: null }
    })

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('returns 500 on email failure', async () => {
    vi.mocked(authModule.getUser).mockResolvedValue({ id: 'user-1', email: 'test@example.com' } as any)
    mockSupabase.rpc.mockImplementation(async (name: string) => {
      if (name === 'get_quote_admin') {
        return {
          data: {
            id: 'q-1', user_id: 'user-1', client_email: 'client@test.com',
            client_name: 'Test Client', quote_number: 'QS-001',
            unique_token: 'token-123', status: 'draft',
            created_at: '2024-01-01T00:00:00Z', valid_until: '2024-02-01T00:00:00Z',
            subtotal: 1000, discount: 0, discount_type: 'percent',
            gst_rate: 18, gst_amount: 180, total: 1180,
            terms: '', notes: '', payment_terms: '',
          },
          error: null,
        }
      }
      if (name === 'get_profile_admin') return { data: { business_name: 'Test Business' }, error: null }
      if (name === 'get_quote_items') return { data: [{ description: 'Item 1', quantity: 1, unit: 'pcs', rate: 1000, amount: 1000 }], error: null }
      return { data: null, error: null }
    })

    vi.mocked(emailModule.sendEmail).mockRejectedValueOnce(new Error('SMTP error'))

    const { POST } = await import('./route')
    const req = createMockRequest('http://localhost/api/send-quote-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: 'q-1' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to send email')
  })
})
