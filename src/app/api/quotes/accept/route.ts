import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncQuoteToCrm } from "@/lib/crm/sync";
import { AcceptQuoteSchema } from "@/lib/api-validation";
import { parseError } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, signatory_name, signatory_email, signature_data } = AcceptQuoteSchema.parse(body);

    const supabase = createAdminClient();

    // Atomic acceptance via RPC — wraps signature + invoice + status in one transaction
    const { data: result, error: rpcError } = await supabase.rpc("accept_quote", {
      p_public_token: public_token,
      p_signatory_name: signatory_name || "Client",
      p_signatory_email: signatory_email || "",
      p_signature_data: signature_data,
    });

    if (rpcError) throw rpcError;

    if (result?.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    if (result?.status === "duplicate") {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }

    // Fire-and-forget CRM sync (non-critical)
    if (result?.quote_id) {
      const { data: quote } = await supabase
        .from("quotes")
        .select("id, quote_number, client_name, client_email, total, status, public_token, created_at")
        .eq("id", result.quote_id)
        .single();

      if (quote) {
        syncQuoteToCrm({
          id: quote.id,
          quote_number: quote.quote_number,
          client_name: quote.client_name,
          client_email: quote.client_email,
          total: quote.total,
          status: "accepted",
          public_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`,
          created_at: quote.created_at,
        }).catch((e) => console.error("CRM sync failed after acceptance:", e));
      }
    }

    return NextResponse.json({
      success: true,
      invoice_number: result?.invoice_number,
    });
  } catch (e) {
    return parseError(e);
  }
}
