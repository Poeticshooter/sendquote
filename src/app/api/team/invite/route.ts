import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuid } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { email, role } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { data, error } = await supabase.from("team_members").insert({
      account_user_id: user.id,
      email,
      role: role || "member",
      status: "invited",
      invite_token: uuid(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, member: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
