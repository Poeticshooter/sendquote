import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SendQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth, apiError } from "@/lib/api-helper";
import { sendEmail } from "@/lib/email/send";
import { quoteReceivedEmail } from "@/lib/email/templates";
import { escapeHtml } from "@/lib/email/escape";
import { trackEvent } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id, recipient_email } = SendQuoteSchema.parse(body);

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (quote.status === "accepted") {
      return NextResponse.json({ error: "Quote already accepted" }, { status: 409 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .single();

    const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`;

    // Send email BEFORE marking as sent — if email fails, status stays "draft"
    const hasEmailConfig = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "placeholder";
    const recipient = recipient_email || quote.client_email;
    if (hasEmailConfig && recipient) {
      const { subject, html } = quoteReceivedEmail({
        clientName: escapeHtml(quote.client_name || "Client"),
        quoteNumber: quote.quote_number,
        quoteUrl,
        businessName: escapeHtml(profile?.business_name || "SendQuote"),
        total: Number(quote.total),
      });
      const emailResult = await sendEmail({
        to: [recipient].filter(Boolean),
        subject,
        html,
        replyTo: user.email,
      });
      if (!emailResult.success) {
        return apiError("Failed to send email. Quote was not sent.", 502);
      }
    }

    // Mark as sent only after email succeeds (or if email is not configured)
    await supabase
      .from("quotes")
      .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", quote_id);

    // Auto-schedule follow-ups (fire-and-forget with logging)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/api/followup/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id }),
    }).catch((e) => console.error("Follow-up scheduling failed:", e));

    trackEvent("quote_sent", { quoteId: quote_id, userId: user.id, hasEmail: !!recipient });

    return success({
      success: true,
      message: "Quote sent successfully",
      url: quoteUrl,
    });
  } catch (e) {
    return parseError(e);
  }
}
