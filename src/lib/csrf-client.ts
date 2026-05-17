import { CSRF_COOKIE_NAME_LOCAL, CSRF_HEADER_NAME_LOCAL } from './csrf'

function getCsrfToken(): string | null {
  const name = `${CSRF_COOKIE_NAME_LOCAL}=`
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    if (cookie.startsWith(name)) {
      return cookie.slice(name.length)
    }
  }
  return null
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getCsrfToken()

  const headers = new Headers(init.headers || {})

  if (token && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((init.method || 'GET').toUpperCase())) {
    headers.set(CSRF_HEADER_NAME_LOCAL, token)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
