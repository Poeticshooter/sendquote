import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth, apiError } from "@/lib/api-helper";
import { sendEmail } from "@/lib/email/send";
import { wrapEmail } from "@/lib/email/templates";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: referrals } = await supabase
      .from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });

    return success({ referrals: referrals || [], referralLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}?ref=${user.id.slice(0, 8)}` });
  } catch (e) {
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { email } = await request.json();
    const emailParseResult = z.string().email("Valid email is required").safeParse(email);
    if (!emailParseResult.success) {
      return apiError(emailParseResult.error.issues[0].message, 400);
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("referrals").select("id").eq("referrer_id", user.id).eq("referred_email", email).maybeSingle();

    if (existing) return apiError("Already referred this email", 409);

    const { data: profile } = await supabase
      .from("profiles").select("business_name").eq("user_id", user.id).single();

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}?ref=${user.id.slice(0, 8)}`;

    await supabase.from("referrals").insert({
      referrer_id: user.id,
      referred_email: email,
      status: "pending",
      reward_months: 1,
    });

    await sendEmail({
      to: [email],
      subject: `${profile?.business_name || "Someone"} invited you to SendQuote`,
      html: wrapEmail(`
        <h1 style="color:#F5F5F5;font-size:24px;font-weight:700;margin:0 0 8px 0;">You're invited!</h1>
        <p style="color:#808080;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
          <strong style="color:#F5F5F5;">${profile?.business_name || "A friend"}</strong> has been using SendQuote to close deals faster and wants you to try it too.
        </p>
        <p style="color:#808080;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
          Create GST-ready quotes in 60 seconds with AI. Interactive deal rooms, e-signatures, and payment collection — all in one platform.
        </p>
        <div style="text-align:center;">
          <a href="${referralLink}" style="display:inline-block;padding:14px 32px;background:#00D4AA;color:#0A0A0A;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
            Try SendQuote Free
          </a>
        </div>
      `),
    });

    return success({ success: true });
  } catch (e) {
    return parseError(e);
  }
}
