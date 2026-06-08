const CSRF_COOKIE = "__csrf";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in",
  "http://localhost:3000",
];

export function verifyCsrfToken(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
  headers: { get: (name: string) => string | null };
}): { ok: true } | { ok: false; status: number; message: string } {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);
  if (!cookieToken || !headerToken) {
    return { ok: false, status: 403, message: "CSRF token missing" };
  }
  if (cookieToken.length !== headerToken.length) {
    return { ok: false, status: 403, message: "CSRF token mismatch" };
  }
  if (cookieToken !== headerToken) {
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
