import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot, rateLimitCheck } from "@/lib/security";
import { verifyOrigin, verifyCsrfToken } from "@/lib/security/csrf";
import { v4 as uuid } from "uuid";

const publicPaths = [
  "/", "/login", "/signup", "/onboarding", "/forgot-password", "/pricing", "/blog",
  "/docs", "/changelog", "/faq", "/contact", "/privacy", "/terms",
  "/features", "/comparisons",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = uuid().slice(0, 12);

  const ua = request.headers.get("user-agent") || "";
  const botResult = detectBot(ua);

  if (botResult.isBot && !botResult.isAiCrawler) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "index, follow, max-snippet:-1");
    response.headers.set("X-Request-Id", requestId);
    return response;
  }

  if (pathname.startsWith("/api/")) {
    const allowed = await rateLimitCheck(request);
    if (!allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60", "X-Request-Id": requestId },
      });
    }

    const method = request.method;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        !pathname.startsWith("/api/webhook") &&
        !pathname.startsWith("/api/webhooks") &&
        !pathname.startsWith("/api/health") &&
        !pathname.startsWith("/api/quotes/accept") &&
        !pathname.startsWith("/api/chat/buyer") &&
        !pathname.startsWith("/api/events") &&
        !pathname.startsWith("/api/portal")) {
      const originResult = verifyOrigin(request);
      if (!originResult.ok) {
        return NextResponse.json({ error: originResult.message }, { status: originResult.status, headers: { "X-Request-Id": requestId } });
      }

      const csrfResult = verifyCsrfToken(request);
      if (!csrfResult.ok) {
        return NextResponse.json({ error: csrfResult.message }, { status: csrfResult.status, headers: { "X-Request-Id": requestId } });
      }
    }
  }

  const isPublic = publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/q/") || pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") || pathname.startsWith("/blog/") ||
    pathname.startsWith("/auth/");

  if (isPublic) {
    const resp = NextResponse.next();
    resp.headers.set("X-Request-Id", requestId);
    return resp;
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
  if (!user) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    redirect.headers.set("X-Request-Id", requestId);
    return redirect;
  }

  response.headers.set("X-Request-Id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|llms\\.txt|robots\\.txt|sitemap\\.xml|opensearch\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt)$).*)"],
};
