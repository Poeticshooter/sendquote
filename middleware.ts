import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { detectBot, rateLimitCheck } from "@/lib/security";
import { verifyOrigin } from "@/lib/security/csrf";

const publicPaths = [
  "/", "/login", "/signup", "/onboarding", "/forgot-password", "/pricing", "/blog",
  "/docs", "/changelog", "/faq", "/contact", "/privacy", "/terms",
  "/features", "/comparisons",
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
        return NextResponse.json({ error: originResult.message }, { status: originResult.status });
      }
    }
  }

  const isPublic = publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/q/") || pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") || pathname.startsWith("/blog/") ||
    pathname.startsWith("/auth/");

  if (isPublic) return NextResponse.next();

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|llms\\.txt|robots\\.txt|sitemap\\.xml|opensearch\\.xml|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt)$).*)"],
};
