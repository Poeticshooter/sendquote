import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncQuoteToCrm } from "@/lib/crm/sync";
import { success, parseError, requireAuth } from "@/lib/api-helper";

const CrmSyncSchema = z.object({
  quote_id: z.string().uuid("Invalid quote ID"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id } = CrmSyncSchema.parse(body);

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("id, quote_number, client_name, client_email, total, status, public_token, created_at")
      .eq("id", quote_id)
      .eq("user_id", user.id)
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

    return success(result);
  } catch (e) {
    return parseError(e);
  }
}
