export const CSRF_TOKEN = 'test-csrf-token-1234567890abcdef'
const ORIGIN = 'http://localhost:3000'

export function createMockRequest(url: string, options: RequestInit & { csrfToken?: string } = {}) {
  const { csrfToken, headers = {}, body, method = 'GET' } = options
  const token = csrfToken || CSRF_TOKEN

  const headerObj: Record<string, string> = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : { ...(headers as Record<string, string>) }

  headerObj['cookie'] = `__csrf=${token}`
  headerObj['x-csrf-token'] = token
  headerObj['origin'] = ORIGIN

  return {
    url,
    method,
    headers: new Headers(headerObj),
    cookies: {
      get: (name: string) => name === '__csrf' ? { value: token } : undefined,
    },
    nextUrl: new URL(url),
    json: () => Promise.resolve(body ? JSON.parse(body as string) : {}),
  }
}
