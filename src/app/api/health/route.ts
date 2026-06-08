import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "unknown",
  };

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (dbUrl) {
    checks.database = "configured";
  } else {
    checks.database = "missing";
    checks.status = "degraded";
  }

  const status = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status });
}
