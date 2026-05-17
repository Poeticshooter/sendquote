import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as supabaseModule from '@/lib/supabase'
import { CSRF_TOKEN } from '@/test/csrf-helpers'

vi.mock('@/lib/supabase')

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
  from: vi.fn(),
}

const mockStorage = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
}

const mockProfileBuilder = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn(),
}

function makeRequestWithFile(file?: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> }, csrfToken?: string) {
  const token = csrfToken || CSRF_TOKEN
  return {
    headers: new Headers({
      Authorization: 'Bearer valid-token',
      cookie: `__csrf=${token}`,
      'x-csrf-token': token,
      origin: 'http://localhost:3000',
    }),
    cookies: {
      get: (name: string) => name === '__csrf' ? { value: token } : undefined,
    },
    formData: () => Promise.resolve({
      get: (key: string) => key === 'logo' ? file : null,
    }),
  }
}

describe('POST /api/upload-logo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabaseModule.createAdminClient).mockReturnValue(mockSupabase as any)
    mockSupabase.storage.from.mockReturnValue(mockStorage)
    mockSupabase.from.mockReturnValue(mockProfileBuilder)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 without auth header', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/upload-logo', { method: 'POST' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 401 for invalid token', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') })
    const { POST } = await import('./route')
    const req = makeRequestWithFile(undefined, CSRF_TOKEN)
    ;(req as any).headers.set('Authorization', 'Bearer invalid-token')
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 without file', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const { POST } = await import('./route')
    const req = makeRequestWithFile()
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for file too large', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const { POST } = await import('./route')
    const req = makeRequestWithFile({
      name: 'logo.png',
      type: 'image/png',
      size: 3 * 1024 * 1024,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid file type', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    const { POST } = await import('./route')
    const req = makeRequestWithFile({
      name: 'logo.gif',
      type: 'image/gif',
      size: 1000,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('uploads logo and returns URL', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockStorage.upload.mockResolvedValue({ error: null })
    mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/logo.png' } })
    mockProfileBuilder.eq.mockResolvedValue({ error: null })

    const { POST } = await import('./route')
    const req = makeRequestWithFile({
      name: 'logo.png',
      type: 'image/png',
      size: 1000,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://example.com/logo.png')
  })

  it('returns 500 on upload failure', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
    mockStorage.upload.mockResolvedValue({ error: { message: 'Storage error' } })

    const { POST } = await import('./route')
    const req = makeRequestWithFile({
      name: 'logo.png',
      type: 'image/png',
      size: 1000,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
