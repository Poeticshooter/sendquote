import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status, plan_expiry, billing_cycle")
      .eq("user_id", user.id)
      .single();

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return success({
      plan: profile?.plan || "starter",
      status: profile?.subscription_status || "active",
      expiry: profile?.plan_expiry,
      billingCycle: profile?.billing_cycle || "monthly",
      recentSubscription: subscriptions?.[0] || null,
    });
  } catch (e) {
    return parseError(e);
  }
}
