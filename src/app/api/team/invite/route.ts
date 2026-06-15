import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";
import { success, parseError, requireAuth } from "@/lib/api-helper";
import { checkMemoryRateLimit } from "@/lib/rate-limit";

const TeamRoleSchema = z.enum(["admin", "member", "viewer"]);

const TeamInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: TeamRoleSchema.optional().default("member"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!checkMemoryRateLimit(`team-invite:${user.id}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email, role } = TeamInviteSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase.from("team_members").insert({
      account_user_id: user.id,
      email,
      role,
      status: "invited",
      invite_token: uuid(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return success({ success: true, member: data }, 201);
  } catch (e) {
    return parseError(e);
  }
}
