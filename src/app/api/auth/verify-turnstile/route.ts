import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Turnstile not configured" }, { status: 500 });
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: `secret=${secret}&response=${token}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    const data = await res.json();
    return NextResponse.json({ success: data.success });
  } catch {
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
