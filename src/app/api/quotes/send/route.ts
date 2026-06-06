import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { quote_id, recipient_email } = await request.json();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .single();

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    await supabase
      .from("quotes")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", quote_id);

    const profile = await supabase
      .from("profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .single();

    const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "placeholder") {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SendQuote <quotes@sendquote.in>",
          to: [recipient_email || quote.client_email],
          subject: `Quote ${quote.quote_number} from ${profile.data?.business_name || "SendQuote"}`,
          html: `
            <h2>You've received a quote!</h2>
            <p><strong>${profile.data?.business_name || "SendQuote"}</strong> has sent you a quote.</p>
            <p style="font-size:24px;font-weight:bold">${quote.quote_number}</p>
            <p>Amount: <strong>$${quote.total}</strong></p>
            <a href="${quoteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;margin-top:16px">
              View Quote
            </a>
          `,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Quote sent successfully",
      url: quoteUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
