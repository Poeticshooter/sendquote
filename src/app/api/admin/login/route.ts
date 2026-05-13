import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Admin not configured on server" }, { status: 500 })
    }

    if (email !== adminEmail || password !== adminPassword) {
      await new Promise(r => setTimeout(r, 500))
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Admin login error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
