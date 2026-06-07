import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SendQuoteSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

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
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SendQuote <quotes@sendquote.in>",
          to: [recipient_email || quote.client_email].filter(Boolean),
          subject: `Quote ${quote.quote_number} from ${profile?.business_name || "SendQuote"}`,
          html: `
            <h2>You've received a quote!</h2>
            <p><strong>${profile?.business_name || "SendQuote"}</strong> has sent you a quote.</p>
            <p style="font-size:24px;font-weight:bold">${quote.quote_number}</p>
            <p>Amount: <strong>$${quote.total}</strong></p>
            <a href="${quoteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;margin-top:16px">
              View Quote
            </a>
          `,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.text();
        console.error("Failed to send email:", err);
      }
    }

    return success({
      success: true,
      message: "Quote sent successfully",
      url: quoteUrl,
    });
  } catch (e) {
    return parseError(e);
  }
}
