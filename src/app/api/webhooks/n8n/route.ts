import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  
    const authHeader = request.headers.get("authorization") || "";
    const expectedToken = process.env.N8N_WEBHOOK_SECRET;

    if (!expectedToken) {
      console.error("N8N_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const expected = `Bearer ${expectedToken}`;
    
    const safe = authHeader.length === expected.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
    if (!safe) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, quote_id, quote_token } = body;

    if (!event || (!quote_id && !quote_token)) {
      return NextResponse.json({ error: "Missing event and quote_id/quote_token" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let quote;
    if (quote_id) {
      const { data } = await supabase
        .from("quotes")
        .select("*, profiles(business_name, phone)")
        .eq("id", quote_id)
        .single();
      quote = data;
    } else if (quote_token) {
      const { data } = await supabase
        .from("quotes")
        .select("*, profiles(business_name, phone)")
        .eq("public_token", quote_token)
        .single();
      quote = data;
    }

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    switch (event) {
      case "follow_up": {
        const { data: reminders } = await supabase
          .from("cron_reminders")
          .insert({ quote_id: quote.id, reminder_type: "follow_up", sent_at: new Date().toISOString() })
          .select();

        return NextResponse.json({ success: true, action: "follow_up_created", reminder: reminders?.[0] });
      }

      case "expiry_warning": {
        const { data: reminders } = await supabase
          .from("cron_reminders")
          .insert({ quote_id: quote.id, reminder_type: "expiry_warning", sent_at: new Date().toISOString() })
          .select();

        return NextResponse.json({ success: true, action: "expiry_warning_created", reminder: reminders?.[0] });
      }

      case "crm_sync": {
        const { syncQuoteToCrm } = await import("@/lib/crm/sync");
        const result = await syncQuoteToCrm({
          id: quote.id,
          quote_number: quote.quote_number,
          client_name: quote.client_name,
          client_email: quote.client_email,
          total: quote.total,
          status: quote.status,
          public_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sendquote.in"}/q/${quote.public_token}`,
          created_at: quote.created_at,
        });
        return NextResponse.json({ success: true, action: "crm_synced", result });
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("n8n webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
