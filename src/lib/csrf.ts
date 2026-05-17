const CSRF_COOKIE_NAME = '__csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

function isProd(): boolean {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').startsWith('https')
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export function setCsrfCookie(response: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } }, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isProd(),
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

export function verifyCsrfToken(request: { cookies: { get: (name: string) => { value?: string } | undefined }; headers: { get: (name: string) => string | null } }): { ok: true } | { ok: false; status: number; message: string } {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return { ok: false, status: 403, message: 'CSRF token missing' }
  }

  if (cookieToken !== headerToken) {
    return { ok: false, status: 403, message: 'CSRF token mismatch' }
  }

  return { ok: true }
}

export function verifyOrigin(request: { headers: { get: (name: string) => string | null } }): { ok: true } | { ok: false; status: number; message: string } {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) {
    return { ok: false, status: 403, message: 'Request origin not verified' }
  }

  const checkValue = origin || referer
  const allowed = [siteUrl(), 'http://localhost:3000']

  if (!allowed.some(a => checkValue?.startsWith(a))) {
    return { ok: false, status: 403, message: 'Request origin not verified' }
  }

  return { ok: true }
}

export function csrfProtected(request: { cookies: { get: (name: string) => { value?: string } | undefined }; headers: { get: (name: string) => string | null } }): { ok: true } | { ok: false; status: number; message: string } {
  const csrfResult = verifyCsrfToken(request)
  if (!csrfResult.ok) return csrfResult

  const originResult = verifyOrigin(request)
  if (!originResult.ok) return originResult

  return { ok: true }
}

export const CSRF_COOKIE_NAME_LOCAL = CSRF_COOKIE_NAME
export const CSRF_HEADER_NAME_LOCAL = CSRF_HEADER_NAME
