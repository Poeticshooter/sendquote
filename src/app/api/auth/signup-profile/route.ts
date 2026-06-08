import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, businessName, email } = await request.json();
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the caller owns this userId
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").insert({
      user_id: userId,
      business_name: businessName || null,
      plan: "starter",
      billing_cycle: "monthly",
      monthly_quote_count: 0,
      subscription_status: "inactive",
      quote_counter: 0,
    });

    if (error) {
      console.error("Profile insert error:", error);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Signup profile error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
