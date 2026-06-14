export type PlanTier = "free" | "growth" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<string, {
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
  free: { quotes_per_month: 5, ai_generation: false, crm_sync: false, approval_workflows: false, ai_followups: false, buyer_chat: false, analytics: false, api_access: false, custom_branding: false, contract_automation: false, team_members: 1 },
  growth: { quotes_per_month: 99999, ai_generation: true, crm_sync: true, approval_workflows: true, ai_followups: true, buyer_chat: true, analytics: true, api_access: false, custom_branding: false, contract_automation: false, team_members: 5 },
  pro: { quotes_per_month: 99999, ai_generation: true, crm_sync: true, approval_workflows: true, ai_followups: true, buyer_chat: true, analytics: true, api_access: true, custom_branding: true, contract_automation: true, team_members: 20 },
  enterprise: { quotes_per_month: 999999, ai_generation: true, crm_sync: true, approval_workflows: true, ai_followups: true, buyer_chat: true, analytics: true, api_access: true, custom_branding: true, contract_automation: true, team_members: 999 },
};

export function canAccess(feature: keyof typeof PLAN_LIMITS.free, plan: PlanTier): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits[feature] === true || (typeof limits[feature] === "number" && limits[feature] > 0);
}
