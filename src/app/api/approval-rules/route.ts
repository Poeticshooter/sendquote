import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApprovalRuleSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("approval_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");

    if (error) throw error;
    return success(data);
  } catch (e) {
    return parseError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = ApprovalRuleSchema.parse(body);

    const supabase = await createClient();

    const { data: rule, error } = await supabase
      .from("approval_rules")
      .insert({
        user_id: user.id,
        name: data.name,
        trigger_type: data.trigger_type,
        trigger_value: data.trigger_value,
        approver_role: data.approver_role,
        action: data.action,
      })
      .select()
      .single();

    if (error) throw error;
    return success(rule, 201);
  } catch (e) {
    return parseError(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { id } = await request.json();

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("approval_rules").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return success({ success: true });
  } catch (e) {
    return parseError(e);
  }
}
