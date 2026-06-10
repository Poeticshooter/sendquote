import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";
import { success, parseError, requireAuth } from "@/lib/api-helper";

const TeamInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { email, role } = TeamInviteSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase.from("team_members").insert({
      account_user_id: user.id,
      email,
      role: role || "member",
      status: "invited",
      invite_token: uuid(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return success({ success: true, member: data }, 201);
  } catch (e) {
    return parseError(e);
  }
}
