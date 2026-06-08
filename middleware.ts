import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot, rateLimitCheck } from "@/lib/security";
import { verifyCsrfToken, verifyOrigin } from "@/lib/security/csrf";

const publicPaths = [
  "/", "/login", "/signup", "/forgot-password", "/pricing", "/blog",
  "/docs", "/changelog", "/faq", "/contact", "/privacy", "/terms",
  "/features",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ua = request.headers.get("user-agent") || "";
  const botResult = detectBot(ua);

  if (botResult.isBot && !botResult.isAiCrawler) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "index, follow, max-snippet:-1");
    return response;
  }

  if (pathname.startsWith("/api/")) {
    const allowed = await rateLimitCheck(request);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }

    // CSRF protection for state-changing methods (skip webhooks)
    const method = request.method;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        !pathname.startsWith("/api/webhook") &&
        !pathname.startsWith("/api/webhooks") &&
        !pathname.startsWith("/api/health") &&
        !pathname.startsWith("/api/voice")) {
      const csrfResult = verifyCsrfToken(request);
      if (!csrfResult.ok) {
        return NextResponse.json({ error: csrfResult.message }, { status: csrfResult.status });
      }
      const originResult = verifyOrigin(request);
      if (!originResult.ok) {
        return NextResponse.json({ error: originResult.message }, { status: originResult.status });
      }
    }
  }

  const isPublic = publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/q/") || pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") || pathname.startsWith("/blog/") ||
    pathname.startsWith("/auth/");

  if (isPublic) {
    const publicResponse = NextResponse.next();
    if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
      const existingToken = request.cookies.get("__csrf")?.value;
      const csrfToken = existingToken || crypto.randomUUID();
      publicResponse.cookies.set("__csrf", csrfToken, {
        httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 86400,
      });
    }
    return publicResponse;
  }

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
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // Set CSRF cookie for authenticated pages (preserve existing)
  const existingToken = request.cookies.get("__csrf")?.value;
  const csrfToken = existingToken || crypto.randomUUID();
  response.cookies.set("__csrf", csrfToken, {
    httpOnly: false, secure: true, sameSite: "strict", path: "/", maxAge: 86400,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|llms\\.txt|robots\\.txt|sitemap\\.xml|opensearch\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt)$).*)"],
};
