import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

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

    return NextResponse.json({
      plan: profile?.plan || "starter",
      status: profile?.subscription_status || "active",
      expiry: profile?.plan_expiry,
      billingCycle: profile?.billing_cycle || "monthly",
      recentSubscription: subscriptions?.[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
