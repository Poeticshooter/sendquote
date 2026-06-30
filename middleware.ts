import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot, rateLimitCheck } from "@/lib/security";
import { verifyOrigin } from "@/lib/security/csrf";
import { v4 as uuid } from "uuid";

const PUBLIC_PATHS = new Set([
  "/", "/login", "/signup", "/onboarding", "/forgot-password",
  "/pricing", "/blog", "/docs", "/changelog", "/faq", "/contact",
  "/privacy", "/terms", "/features", "/comparisons",
]);

const CSRF_SKIP_PREFIXES = [
  "/api/webhook", "/api/webhooks", "/api/health",
  "/api/quotes/accept", "/api/chat/buyer",
  "/api/events", "/api/portal",
];

function shouldSkipCsrf(pathname: string): boolean {
  return CSRF_SKIP_PREFIXES.some((p) => pathname.startsWith(p));
}

function applySecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set("X-Request-Id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = uuid().slice(0, 12);

  // 1. Bot Detection
  const ua = request.headers.get("user-agent") || "";
  const botResult = detectBot(ua);
  if (botResult.isBot && !botResult.isAiCrawler) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "index, follow, max-snippet:-1");
    applySecurityHeaders(response, requestId);
    return response;
  }

  // 2. API Route Handling
  if (pathname.startsWith("/api/")) {
    const allowed = await rateLimitCheck(request);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
          "X-Request-Id": requestId,
        },
      });
    }

    // CSRF protection for state-changing methods
    const method = request.method;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !shouldSkipCsrf(pathname)) {
      const originResult = verifyOrigin(request);
      if (!originResult.ok) {
        return NextResponse.json(
          { error: originResult.message },
          { status: originResult.status, headers: { "X-Request-Id": requestId } }
        );
      }
    }

    const resp = NextResponse.next();
    applySecurityHeaders(resp, requestId);
    return resp;
  }

  // 3. Public Paths
  const isPublic = PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/auth/");

  if (isPublic) {
    const resp = NextResponse.next();
    applySecurityHeaders(resp, requestId);
    resp.headers.set("X-Robots-Tag", "index, follow, max-snippet:-1");
    return resp;
  }

  // 4. Protected Routes (require auth)
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    applySecurityHeaders(redirect, requestId);
    return redirect;
  }

  applySecurityHeaders(response, requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|llms\\.txt|robots\\.txt|sitemap\\.xml|opensearch\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt)$).*)"],
};
