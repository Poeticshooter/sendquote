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
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id", { count: "exact", head: true }).limit(1);
    if (error) {
      checks.database_reachable = false;
      checks.database_error = error.message;
      if (checks.status === "ok") checks.status = "degraded";
    } else {
      checks.database_reachable = true;
    }
  } catch (e) {
    checks.database_reachable = false;
    checks.database_error = e instanceof Error ? e.message : "Unknown error";
    if (checks.status === "ok") checks.status = "degraded";
  }

  const status = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status });
}
