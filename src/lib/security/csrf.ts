const CSRF_COOKIE = "__csrf";
const CSRF_HEADER = "x-csrf-token";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in",
  "http://localhost:3000",
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verifyCsrfToken(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
  headers: { get: (name: string) => string | null };
}): { ok: true } | { ok: false; status: number; message: string } {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) {
    return { ok: false, status: 403, message: "CSRF token missing" };
  }
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return { ok: false, status: 403, message: "CSRF token mismatch" };
  }
  return { ok: true };
}

export function verifyOrigin(request: {
  headers: { get: (name: string) => string | null };
}): { ok: true } | { ok: false; status: number; message: string } {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const checkValue = origin || referer;
  if (!checkValue) return { ok: false, status: 403, message: "Origin not verified" };

  try {
    const url = new URL(checkValue);
    const allowed = ALLOWED_ORIGINS.filter(Boolean);
    if (!allowed.some((a) => {
      try { return new URL(a).origin === url.origin; }
      catch { return false; }
    })) {
      return { ok: false, status: 403, message: "Origin not allowed" };
    }
  } catch {
    return { ok: false, status: 403, message: "Invalid origin" };
  }
  return { ok: true };
}

// csrfProtected removed — unused; use verifyCsrfToken + verifyOrigin separately
