import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SendQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";
import { sendEmail } from "@/lib/email/send";
import { quoteReceivedEmail } from "@/lib/email/templates";

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

    await supabase
      .from("quotes")
      .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", quote_id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .single();

    const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "placeholder") {
      const { subject, html } = quoteReceivedEmail({
        clientName: quote.client_name || "Client",
        quoteNumber: quote.quote_number,
        quoteUrl,
        businessName: profile?.business_name || "SendQuote",
        total: Number(quote.total),
      });
      await sendEmail({
        to: [recipient_email || quote.client_email].filter(Boolean),
        subject,
        html,
        replyTo: user.email,
      });
    }

    // Auto-schedule follow-ups (fire-and-forget with logging)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/api/followup/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id }),
    }).catch((e) => console.error("Follow-up scheduling failed:", e));

    return success({
      success: true,
      message: "Quote sent successfully",
      url: quoteUrl,
    });
  } catch (e) {
    return parseError(e);
  }
}
