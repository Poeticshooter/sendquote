import { success, parseError, requireAuth } from "@/lib/api-helper";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const awards: string[] = [];

    const { data: quotes } = await supabase
      .from("quotes").select("status").eq("user_id", user.id);

    const { data: clients } = await supabase
      .from("clients").select("id").eq("user_id", user.id);

    const qCount = quotes?.length || 0;
    const aCount = quotes?.filter(q => q.status === "accepted").length || 0;
    const cCount = clients?.length || 0;
    const winRate = qCount >= 10 ? Math.round((aCount / qCount) * 100) : 0;

    const checks: { key: string; earned: boolean }[] = [
      { key: "first_quote", earned: qCount >= 1 },
      { key: "ten_quotes", earned: qCount >= 10 },
      { key: "fifty_quotes", earned: qCount >= 50 },
      { key: "first_accepted", earned: aCount >= 1 },
      { key: "five_accepted", earned: aCount >= 5 },
      { key: "twenty_accepted", earned: aCount >= 20 },
      { key: "first_client", earned: cCount >= 1 },
      { key: "ten_clients", earned: cCount >= 10 },
      { key: "high_win_rate", earned: winRate >= 75 },
    ];

    for (const check of checks) {
      if (!check.earned) continue;
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", user.id)
        .eq("achievement", check.key)
        .maybeSingle();

      if (existing) continue;

      await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement: check.key,
      });
      awards.push(check.key);
    }

    return success({ awarded: awards, count: awards.length });
  } catch (e) {
    return parseError(e);
  }
}
