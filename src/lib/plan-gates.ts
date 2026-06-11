import { createClient } from "./supabase/server";
import { PLAN_LIMITS, canAccess } from "./plan-limits";
import type { PlanTier } from "./plan-limits";

export { PLAN_LIMITS, canAccess };
export type { PlanTier };

export async function getUserPlan(): Promise<{ plan: PlanTier; limits: typeof PLAN_LIMITS[PlanTier] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const plan = (profile?.plan || "free") as PlanTier;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return { plan, limits };
}

export async function checkQuoteLimit(): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const plan = await getUserPlan();
  const limit = plan.limits.quotes_per_month;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const used = count || 0;
  return { allowed: used < limit, used, limit };
}
