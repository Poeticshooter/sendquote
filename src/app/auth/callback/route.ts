import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_REDIRECTS = new Set(["/dashboard", "/onboarding", "/settings", "/login"]);

function validateRedirect(next: string | null): string {
  if (next && ALLOWED_REDIRECTS.has(next)) return next;
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = validateRedirect(searchParams.get("next"));
  const state = searchParams.get("state");

  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${origin}/login?error=state_mismatch`);
  }

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

          const { error: insertError } = await admin.from("profiles").insert({
            user_id: user.id,
            business_name: businessName,
            plan: "free",
            billing_cycle: "monthly",
            monthly_quote_count: 0,
            subscription_status: "inactive",
            quote_counter: 0,
          });

          if (insertError) {
            console.error("Profile insert error in callback:", insertError);
            const errorResponse = NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
            errorResponse.cookies.delete("oauth_state");
            return errorResponse;
          }
        }
      }
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.delete("oauth_state");
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
