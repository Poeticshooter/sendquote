import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import crypto from "crypto"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  logger.warn('Admin panel disabled: ADMIN_EMAIL and ADMIN_PASSWORD not set')
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(req: Request) {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Admin credentials not configured" }, { status: 503 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await rateLimit(ip, 'admin-login', 5, 15 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later.", retryAfter: limit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    await new Promise(r => setTimeout(r, 300 + Math.random() * 200))

    if (!safeCompare(email, ADMIN_EMAIL) || !safeCompare(password, ADMIN_PASSWORD)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)

    const { error: insertError } = await supabase
      .from('admin_sessions')
      .insert({
        token: sessionToken,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      logger.error('Failed to store admin session', { error: insertError instanceof Error ? insertError.message : String(insertError) })
      return NextResponse.json({ error: "Session creation failed" }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Admin login error', { error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
