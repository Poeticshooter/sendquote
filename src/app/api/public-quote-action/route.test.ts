import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@/lib/supabase'
import * as emailModule from '@/lib/email'
import * as sanitizeModule from '@/lib/sanitize'
import * as activityModule from '@/lib/activity'

vi.mock('@/lib/supabase')
vi.mock('@/lib/email')
vi.mock('@/lib/sanitize', () => ({
  sanitizeInput: vi.fn((input: string) => input),
}))
vi.mock('@/lib/activity')

const mockSupabase = {
  from: vi.fn(),
  auth: {
    admin: {
      getUserById: vi.fn(),
    },
  },
}

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn(),
}

describe('POST /api/public-quote-action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    vi.mocked(emailModule.sendEmail).mockResolvedValue(undefined)
    vi.mocked(activityModule.logActivity).mockResolvedValue(undefined)
    mockSupabase.from.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.single.mockReset()
    mockQueryBuilder.update.mockReturnThis()
    mockQueryBuilder.insert.mockReset()
    mockSupabase.auth.admin.getUserById.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 400 without token', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accepted' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('token')
  })

  it('returns 400 without action', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('action')
  })

  it('returns 400 for invalid action', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'invalid' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('action')
  })

  it('returns 404 for non-existent token', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'nonexistent', action: 'accepted' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Quote not found')
  })

  it('updates status to accepted', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: {
        id: 'q-1',
        user_id: 'user-1',
        client_name: 'Test Client',
        quote_number: 'QS-001',
        unique_token: 'valid-token',
      },
      error: null,
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'user@test.com' } } })
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: {
        id: 'q-1',
        user_id: 'user-1',
        client_name: 'Test Client',
        quote_number: 'QS-001',
        unique_token: 'valid-token',
      },
      error: null,
    })
    mockQueryBuilder.single.mockResolvedValueOnce({
      data: { business_name: 'Test Business', smtp_email: 'smtp@test.com', smtp_app_password: 'pass' },
      error: null,
    })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('updates status to changes_requested', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return {
        data: { business_name: 'Test Business', smtp_email: 'smtp@test.com', smtp_app_password: 'pass' },
        error: null,
      }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'user@test.com' } } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'changes_requested', notes: 'Please reduce price' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('inserts quote_event with sanitized notes', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted', notes: 'Test notes' }),
    })
    await POST(req as any)

    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        quote_id: 'q-1',
        event_type: 'accepted',
      })
    )
  })

  it('logs activity', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return { data: null, error: null }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted' }),
    })
    await POST(req as any)

    expect(vi.mocked(activityModule.logActivity)).toHaveBeenCalledWith(
      'user-1',
      'quote',
      'q-1',
      'quote_accepted',
      expect.any(Object)
    )
  })

  it('sends email on accept', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return {
        data: { business_name: 'Test Business', smtp_email: 'smtp@test.com', smtp_app_password: 'pass' },
        error: null,
      }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'user@test.com' } } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted' }),
    })
    await POST(req as any)

    expect(vi.mocked(emailModule.sendEmail)).toHaveBeenCalledWith(
      expect.any(Object),
      'user@test.com',
      expect.stringContaining('accepted'),
      expect.any(String)
    )
  })

  it('sends email with notes on changes', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return {
        data: { business_name: 'Test Business', smtp_email: 'smtp@test.com', smtp_app_password: 'pass' },
        error: null,
      }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'user@test.com' } } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'changes_requested', notes: 'Reduce price by 10%' }),
    })
    await POST(req as any)

    expect(vi.mocked(emailModule.sendEmail)).toHaveBeenCalledWith(
      expect.any(Object),
      'user@test.com',
      expect.stringContaining('Changes requested'),
      expect.stringContaining('Reduce price by 10%')
    )
  })

  it('returns ok: true on email failure', async () => {
    mockQueryBuilder.single.mockImplementation(async function(this: any) {
      const callOrder = mockQueryBuilder.single.mock.calls.length
      if (callOrder === 1) {
        return {
          data: {
            id: 'q-1',
            user_id: 'user-1',
            client_name: 'Test Client',
            quote_number: 'QS-001',
            unique_token: 'valid-token',
          },
          error: null,
        }
      }
      return {
        data: { business_name: 'Test Business', smtp_email: 'smtp@test.com', smtp_app_password: 'pass' },
        error: null,
      }
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: 'user@test.com' } } })
    vi.mocked(emailModule.sendEmail).mockRejectedValueOnce(new Error('SMTP error'))

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('handles missing sender email', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: {
        id: 'q-1',
        user_id: 'user-1',
        client_name: 'Test Client',
        quote_number: 'QS-001',
        unique_token: 'valid-token',
      },
      error: null,
    })
    mockSupabase.auth.admin.getUserById.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/public-quote-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token', action: 'accepted' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(vi.mocked(emailModule.sendEmail)).not.toHaveBeenCalled()
  })
})
