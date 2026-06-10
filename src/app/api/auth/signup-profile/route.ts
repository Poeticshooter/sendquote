import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BodySchema = z.union([
  z.object({
    onboardingStep: z.literal("profile"),
    businessName: z.string().max(255).optional(),
    businessPhone: z.string().max(50).optional(),
  }),
  z.object({
    onboarding_completed: z.boolean(),
    businessName: z.string().max(255).optional(),
    businessPhone: z.string().max(50).optional(),
  }),
  z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    businessName: z.string().max(255).optional(),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // Handle profile update - save business info from onboarding wizard
    if (body.onboardingStep === "profile") {
      const { error } = await admin
        .from("profiles")
        .update({
          business_name: body.businessName || null,
          phone: body.businessPhone || null,
        })
        .eq("user_id", user.id);
      if (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle profile update (e.g., onboarding completion)
    if (body.onboarding_completed !== undefined) {
      const updateData: Record<string, unknown> = {
        onboarding_completed: body.onboarding_completed,
      };
      if (body.businessName) updateData.business_name = body.businessName;
      if (body.businessPhone) updateData.phone = body.businessPhone;

      const { error } = await admin
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);
      if (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Handle profile creation (requires userId + email)
    const { userId, businessName, email } = body;
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await admin.from("profiles").upsert({
      user_id: userId,
      business_name: businessName || null,
      plan: "starter",
      billing_cycle: "monthly",
      monthly_quote_count: 0,
      subscription_status: "inactive",
      quote_counter: 0,
      onboarding_completed: false,
    }, { onConflict: "user_id" });

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
