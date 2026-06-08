import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { quote_id } = await request.json();
    if (!quote_id) return success({ error: "quote_id required" }, 400);

    const supabase = await createClient();

    // Verify quote ownership
    const { data: quote } = await supabase
      .from("quotes")
      .select("id, status, valid_until")
      .eq("id", quote_id)
      .eq("user_id", user.id)
      .single();

    if (!quote) return success({ error: "Quote not found" }, 404);

    // Get active sequences (both user-specific and defaults)
    const { data: sequences } = await supabase
      .from("followup_sequences")
      .select("*")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},user_id.eq.00000000-0000-0000-0000-000000000000`);

    if (!sequences?.length) return success({ scheduled: 0 });

    const now = new Date();
    const schedules = [];

    for (const seq of sequences) {
      for (const dayOffset of seq.trigger_days) {
        const scheduledAt = new Date(now);
        scheduledAt.setDate(scheduledAt.getDate() + dayOffset);
        scheduledAt.setHours(9, 0, 0, 0);

        // Check condition match
        const shouldSchedule = seq.trigger_condition === "sent" ||
          (seq.trigger_condition === "expiring_soon" && quote.valid_until);

        if (!shouldSchedule) continue;

        schedules.push({
          quote_id,
          sequence_id: seq.id,
          step: seq.trigger_days.indexOf(dayOffset) + 1,
          scheduled_at: scheduledAt.toISOString(),
          status: "pending",
        });
      }
    }

    if (schedules.length) {
      const { error } = await supabase.from("followup_schedule").insert(schedules);
      if (error) throw error;
    }

    return success({ scheduled: schedules.length });
  } catch (e) {
    return parseError(e);
  }
}
