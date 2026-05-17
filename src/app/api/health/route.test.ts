import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@/lib/supabase'

vi.mock('@/lib/supabase')

const mockSupabase = {
  from: vi.fn(),
}

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  limit: vi.fn(),
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockSupabase.from.mockReturnValue(mockQueryBuilder)
    mockQueryBuilder.select.mockReturnThis()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns healthy', async () => {
    mockQueryBuilder.limit.mockResolvedValue({ error: null })

    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('healthy')
    expect(json.timestamp).toBeDefined()
    expect(json.uptime).toBeDefined()
  })

  it('returns unhealthy on DB failure', async () => {
    mockQueryBuilder.limit.mockResolvedValue({ error: { message: 'connection refused' } })

    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.status).toBe('unhealthy')
    expect(json.error).toBe('connection refused')
  })

  it('returns unhealthy on exception', async () => {
    mockQueryBuilder.limit.mockRejectedValue(new Error('unexpected error'))

    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.status).toBe('unhealthy')
    expect(json.error).toBe('unexpected error')
  })
})
