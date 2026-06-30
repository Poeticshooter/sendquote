import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import * as Sentry from "@sentry/nextjs";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCron(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  const expected = `Bearer ${CRON_SECRET}`;
  if (!CRON_SECRET || !auth || auth.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return auth === expected;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const task = searchParams.get("task") || "all";

  const results: Record<string, { status: string; error?: string }> = {};

  async function runTask(name: string, path: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in";
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      results[name] = { status: res.ok ? "ok" : "failed" };
      if (!res.ok) {
        const text = await res.text().catch(() => "unknown");
        results[name].error = `${res.status}: ${text.slice(0, 200)}`;
      }
    } catch (e) {
      results[name] = { status: "error", error: String(e) };
      Sentry.captureException(e, { extra: { cronTask: name } });
    }
  }

  try {
    if (task === "daily" || task === "all") {
      await Promise.all([
        runTask("expiry_check", "/api/expiry/check"),
        runTask("payment_reminders", "/api/cron/reminders"),
        runTask("followup_process", "/api/followup/process"),
      ]);
    }

    if (task === "weekly" || task === "all") {
      await Promise.all([
        runTask("reconciliation", "/api/reconciliation"),
        runTask("weekly_digest", "/api/cron/weekly-digest"),
      ]);
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    Sentry.captureException(e);
    return NextResponse.json({ error: "Cron dispatch failed", results }, { status: 500 });
  }
}
