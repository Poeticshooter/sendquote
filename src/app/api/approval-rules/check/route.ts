import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApprovalCheckSchema } from "@/lib/api-validation";
import { parseError, requireAuth } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { quote_id } = ApprovalCheckSchema.parse(body);

    const supabase = await createClient();

    const { data: quote } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .eq("user_id", user.id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const { data: rules } = await supabase
      .from("approval_rules")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ needs_approval: false, rules_triggered: [] });
    }

    const triggered: any[] = [];

    for (const rule of rules) {
      if (rule.trigger_type === "discount_percent" && quote.discount > rule.trigger_value) {
        triggered.push(rule);
      } else if (rule.trigger_type === "total_amount" && quote.total > rule.trigger_value) {
        triggered.push(rule);
      } else if (rule.trigger_type === "discount_amount" && quote.discount > rule.trigger_value) {
        triggered.push(rule);
      }
    }

    if (triggered.length > 0) {
      for (const rule of triggered) {
        await supabase.from("approval_requests").insert({
          quote_id: quote.id,
          rule_id: rule.id,
          requested_by: user.id,
          status: "pending",
        });
      }

      await supabase
        .from("quotes")
        .update({ status: "changes_requested", original_status: quote.status })
        .eq("id", quote.id);

      return NextResponse.json({ needs_approval: true, rules_triggered: triggered });
    }

    return NextResponse.json({ needs_approval: false, rules_triggered: [] });
  } catch (e) {
    return parseError(e);
  }
}
