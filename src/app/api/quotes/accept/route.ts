import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncQuoteToCrm } from "@/lib/crm/sync";
import { AcceptQuoteSchema } from "@/lib/api-validation";
import { parseError } from "@/lib/api-helper";
import { sendEmail } from "@/lib/email/send";
import { quoteAcceptedEmail } from "@/lib/email/templates";
import { escapeHtml } from "@/lib/email/escape";

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

    // Fire-and-forget CRM sync + notifications (non-critical)
    if (result?.quote_id) {
      const { data: quote } = await supabase
        .from("quotes")
        .select("id, quote_number, client_name, client_email, total, status, public_token, user_id, created_at")
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

        // Send acceptance notification to the quote owner
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "placeholder" && quote.user_id) {
          const { subject, html } = quoteAcceptedEmail({
            clientName: escapeHtml(quote.client_name || "Client"),
            quoteNumber: quote.quote_number,
            total: Number(quote.total),
          });
          const { data: userData } = await supabase.auth.admin.getUserById(quote.user_id);
          if (userData?.user?.email) {
            sendEmail({ to: [userData.user.email], subject, html }).catch(() => {});
          }
        }
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
