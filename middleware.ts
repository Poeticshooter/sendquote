import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password']
  const isPublic = publicPaths.some(p => pathname === p)

  if (!user && !isPublic && !pathname.startsWith('/q/') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname.startsWith('/q/')) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  if (!response.cookies.get('__csrf')) {
    const token = generateCsrfToken()
    setCsrfCookie(response, token)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
}