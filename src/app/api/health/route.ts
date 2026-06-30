import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Lightweight database connectivity check
  // DO NOT expose error details publicly (security concern)
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    checks.database_reachable = !error;
    if (error) {
      console.error("Health check - DB error:", error.message);
      if (checks.status === "ok") checks.status = "degraded";
    }
  } catch {
    checks.database_reachable = false;
    if (checks.status === "ok") checks.status = "degraded";
  }

  const status = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status });
}
