import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncQuoteToCrm } from "@/lib/crm/sync";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { quote_id } = await request.json();
    if (!quote_id) return NextResponse.json({ error: "Missing quote_id" }, { status: 400 });

    const { data: quote } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, client_email, total, status, public_token, created_at")
      .eq("id", quote_id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const result = await syncQuoteToCrm({
      id: quote.id,
      quote_number: quote.quote_number,
      client_name: quote.client_name,
      client_email: quote.client_email,
      total: quote.total,
      status: quote.status,
      public_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`,
      created_at: quote.created_at,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
