const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in",
  "http://localhost:3000",
];

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
