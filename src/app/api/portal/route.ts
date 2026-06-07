import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RETURNED_QUOTES = 50;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createAdminClient();
    const { data: quotes } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, status, total, created_at, public_token")
      .eq("client_email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(MAX_RETURNED_QUOTES);

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ quotes: [], message: "No records found for this email" });
    }

    const portalData = quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quote_number,
      clientName: q.client_name,
      status: q.status,
      total: q.total,
      createdAt: q.created_at,
      publicUrl: `/q/${q.public_token}`,
    }));

    return NextResponse.json({ quotes: portalData });
  } catch (error: unknown) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
