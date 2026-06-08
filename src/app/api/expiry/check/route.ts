import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken) return false;
  const expected = `Bearer ${expectedToken}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

  const expected = `Bearer ${expectedToken}`;
  if (authHeader.length !== expected.length) return false;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Find quotes expiring in 3 days (full day range)
    const targetDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    targetDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: expiringQuotes } = await admin
      .from("quotes")
      .select("id, quote_number, client_name, client_email, total, public_token, user_id, valid_until")
      .eq("status", "sent")
      .gte("valid_until", targetDate.toISOString())
      .lte("valid_until", dayEnd.toISOString());

    if (expiringQuotes) {
      for (const quote of expiringQuotes) {
        const { data: profile } = await admin
          .from("profiles")
          .select("business_name")
          .eq("user_id", quote.user_id)
          .single();

        const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`;

        await sendEmail({
          to: [quote.client_email].filter(Boolean) as string[],
          subject: `Quote ${quote.quote_number} is expiring soon`,
          html: wrapEmail(`
            <h1 style="color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 8px 0;">Quote expiring soon</h1>
            <p style="color:#808080;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
              Your quote <strong style="color:#F5F5F5;">${quote.quote_number}</strong> from <strong style="color:#F5F5F5;">${profile?.business_name || "SendQuote"}</strong> is expiring in 3 days.
            </p>
            <p style="color:#F5F5F5;font-size:20px;font-weight:700;">₹${Number(quote.total).toLocaleString("en-IN")}</p>
            <div style="text-align:center;margin-top:24px;">
              <a href="${quoteUrl}" style="display:inline-block;padding:14px 32px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
                View & Accept
              </a>
            </div>
          `),
        });
      }
    }

    // Auto-expire past-due quotes
    const { data: overdueQuotes } = await admin
      .from("quotes")
      .select("id")
      .eq("status", "sent")
      .lt("valid_until", now);

    if (overdueQuotes?.length) {
      const ids = overdueQuotes.map(q => q.id);
      await admin.from("quotes").update({ status: "expired", updated_at: now }).in("id", ids);
    }

    return NextResponse.json({
      checked: true,
      expiringAlerts: expiringQuotes?.length || 0,
      autoExpired: overdueQuotes?.length || 0,
    });
  } catch (e) {
    console.error("Expiry check error:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
