import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-helper";

const MAX_RETURNED_QUOTES = 50;

export async function POST(request: NextRequest) {
  try {
    // Require authentication — only sellers can search their own clients' quotes
    const user = await requireAuth();

    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Scope query to the authenticated user's quotes only
    const supabase = await createClient();
    const { data: quotes } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, status, total, created_at")
      .eq("user_id", user.id)
      .eq("client_email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(MAX_RETURNED_QUOTES);

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    const portalData = quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quote_number,
      clientName: q.client_name,
      status: q.status,
      total: q.total,
      createdAt: q.created_at,
      // Do NOT expose public_token — client must use the share link from their email
      publicUrl: null,
    }));

    return NextResponse.json({ quotes: portalData });
  } catch (error: unknown) {
    console.error("Portal error:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
