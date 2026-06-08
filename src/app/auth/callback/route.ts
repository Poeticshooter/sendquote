import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = createAdminClient();
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!existingProfile) {
          const businessName = user.user_metadata?.business_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] || null;

          await admin.from("profiles").insert({
            user_id: user.id,
            business_name: businessName,
            plan: "starter",
            billing_cycle: "monthly",
            monthly_quote_count: 0,
            subscription_status: "inactive",
            quote_counter: 0,
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
