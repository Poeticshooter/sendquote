import "server-only";
import { createClient } from "./supabase/server";

export type PlanTier = "free" | "starter" | "growth" | "pro" | "enterprise";

const PLAN_LIMITS: Record<string, {
  quotes_per_month: number;
  ai_generation: boolean;
  crm_sync: boolean;
  approval_workflows: boolean;
  ai_followups: boolean;
  buyer_chat: boolean;
  analytics: boolean;
  api_access: boolean;
  custom_branding: boolean;
  contract_automation: boolean;
  team_members: number;
}> = {
  free: {
    quotes_per_month: 5,
    ai_generation: false,
    crm_sync: false,
    approval_workflows: false,
    ai_followups: false,
    buyer_chat: false,
    analytics: false,
    api_access: false,
    custom_branding: false,
    contract_automation: false,
    team_members: 1,
  },
  starter: {
    quotes_per_month: 5,
    ai_generation: false,
    crm_sync: false,
    approval_workflows: false,
    ai_followups: false,
    buyer_chat: false,
    analytics: false,
    api_access: false,
    custom_branding: false,
    contract_automation: false,
    team_members: 1,
  },
  growth: {
    quotes_per_month: 99999,
    ai_generation: true,
    crm_sync: true,
    approval_workflows: true,
    ai_followups: true,
    buyer_chat: true,
    analytics: true,
    api_access: false,
    custom_branding: false,
    contract_automation: false,
    team_members: 5,
  },
  pro: {
    quotes_per_month: 99999,
    ai_generation: true,
    crm_sync: true,
    approval_workflows: true,
    ai_followups: true,
    buyer_chat: true,
    analytics: true,
    api_access: true,
    custom_branding: true,
    contract_automation: true,
    team_members: 20,
  },
  enterprise: {
    quotes_per_month: 999999,
    ai_generation: true,
    crm_sync: true,
    approval_workflows: true,
    ai_followups: true,
    buyer_chat: true,
    analytics: true,
    api_access: true,
    custom_branding: true,
    contract_automation: true,
    team_members: 999,
  },
};

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

export function canAccess(feature: keyof typeof PLAN_LIMITS.free, plan: PlanTier): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits[feature] === true || typeof limits[feature] === "number" && limits[feature] > 0;
}
