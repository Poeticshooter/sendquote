import { success, parseError, requireAuth } from "@/lib/api-helper";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: quotes } = await supabase
      .from("quotes").select("status, total, created_at").eq("user_id", user.id).limit(500);

    const { data: clients } = await supabase
      .from("clients").select("id").eq("user_id", user.id);

    const { data: profile } = await supabase
      .from("profiles").select("monthly_quote_count, plan").eq("user_id", user.id).single();

    const total = quotes?.length || 0;
    const accepted = quotes?.filter(q => q.status === "accepted").length || 0;
    const recent30d = quotes?.filter(q => {
      const d = new Date(q.created_at);
      return d >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }).length || 0;

    const clientCount = clients?.length || 0;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    let score = 0;
    score += Math.min(total * 2, 20); // up to 20 for volume
    score += winRate >= 75 ? 25 : winRate >= 50 ? 18 : winRate >= 25 ? 10 : 0; // win rate
    score += Math.min(recent30d * 3, 20); // up to 20 for recency
    score += Math.min(clientCount * 2, 15); // up to 15 for clients
    score += profile?.plan === "pro" || profile?.plan === "enterprise" ? 10 : profile?.plan === "growth" ? 5 : 0;
    score += profile?.monthly_quote_count && profile.monthly_quote_count > 0 ? 10 : 0;
    score = Math.min(score, 100);

    const level = score >= 80 ? "elite" : score >= 60 ? "pro" : score >= 40 ? "growing" : score >= 20 ? "starter" : "beginner";
    const levelLabel = { beginner: "Getting Started", starter: "Active Seller", growing: "Growing Business", pro: "Pro Seller", elite: "Top Performer" }[level];

    const nextMilestone = score < 20 ? 20 : score < 40 ? 40 : score < 60 ? 60 : score < 80 ? 80 : 100;

    return success({
      score, level, levelLabel, nextMilestone,
      total, accepted, winRate, recent30d, clientCount,
    });
  } catch (e) {
    return parseError(e);
  }
}
