import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { verifyCronSecret } from "@/lib/security/cron";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all users who have sent at least one quote or invoice
    const { data: activeUsers } = await supabase
      .from("profiles")
      .select("user_id, business_name")
      .not("business_name", "is", null);

    if (!activeUsers?.length) {
      return NextResponse.json({ sent: 0, message: "No active users" });
    }

    let sent = 0;

    for (const profile of activeUsers) {
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const userEmail = userData?.user?.email;
      if (!userEmail) continue;

      // Get this week's stats
      const [quotesRes, invoicesRes] = await Promise.all([
        supabase
          .from("quotes")
          .select("id, status, total")
          .eq("user_id", profile.user_id)
          .or("is_deleted.is.null,is_deleted.eq.false")
          .gte("created_at", weekAgo.toISOString()),
        supabase
          .from("invoices")
          .select("id, status, total, balance_due, due_date")
          .eq("user_id", profile.user_id)
          .gte("created_at", weekAgo.toISOString()),
      ]);

      const quotes = quotesRes.data ?? [];
      const invoices = invoicesRes.data ?? [];

      if (quotes.length === 0 && invoices.length === 0) continue;

      const quotesSent = quotes.length;
      const quotesApproved = quotes.filter((q) => q.status === "accepted").length;
      const collected = invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + Number(i.total), 0);
      const outstanding = invoices
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + Number(i.balance_due), 0);
      const winRate = quotesSent > 0 ? Math.round((quotesApproved / quotesSent) * 100) : 0;

      const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#141414,#1A1A1A);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
            <div style="margin-bottom:24px;">
              <span style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SendQuote</span>
            </div>
            <h2 style="color:#FFFFFF;font-size:18px;font-weight:700;margin:0 0 4px 0;">
              Your Week in SendQuote
            </h2>
            <p style="color:#A0A0A0;font-size:14px;margin:0 0 24px 0;">
              ${weekAgo.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
              <div style="background:rgba(0,212,170,0.08);border-radius:12px;padding:16px;">
                <div style="color:#00D4AA;font-size:24px;font-weight:700;">${quotesSent}</div>
                <div style="color:#707070;font-size:12px;">Quotes sent</div>
              </div>
              <div style="background:rgba(0,212,170,0.08);border-radius:12px;padding:16px;">
                <div style="color:#00D4AA;font-size:24px;font-weight:700;">${winRate}%</div>
                <div style="color:#707070;font-size:12px;">Approval rate</div>
              </div>
              <div style="background:rgba(0,212,170,0.08);border-radius:12px;padding:16px;">
                <div style="color:#00D4AA;font-size:24px;font-weight:700;">${fmt(collected)}</div>
                <div style="color:#707070;font-size:12px;">Collected</div>
              </div>
              <div style="background:rgba(245,158,11,0.08);border-radius:12px;padding:16px;">
                <div style="color:#F59E0B;font-size:24px;font-weight:700;">${fmt(outstanding)}</div>
                <div style="color:#707070;font-size:12px;">Outstanding</div>
              </div>
            </div>

            <div style="text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/dashboard"
                 style="display:inline-block;padding:14px 36px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
                Go to Dashboard →
              </a>
            </div>

            <p style="color:#606060;font-size:12px;margin-top:24px;text-align:center;line-height:1.6;">
              Tip: Quotes sent within 24 hours of first client conversation close 2x faster.<br/>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/settings/notifications" style="color:#606060;">Unsubscribe from weekly digest</a>
            </p>
          </div>
        </div>
      `.trim();

      const result = await sendEmail({
        to: [userEmail],
        subject: `📊 Your SendQuote week: ${quotesSent} quote${quotesSent !== 1 ? "s" : ""} · ${fmt(collected)} collected`,
        html,
      });

      if (result.success) sent++;
    }

    return NextResponse.json({ sent, total_users: activeUsers.length });
  } catch (e) {
    console.error("Weekly digest error:", e);
    Sentry.captureException(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
