import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth } from "@/lib/api-helper";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("quotes")
      .select("id, status, total, created_at, client_name")
      .eq("user_id", user.id);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: quotes } = await query;

    if (!quotes) return success({ totals: { all: 0 } });

    const total = quotes.length;
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    const lost = quotes.filter((q) => q.status === "lost" || q.status === "expired").length;
    const pending = quotes.filter((q) => q.status === "sent" || q.status === "opened").length;
    const totalRevenue = quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + q.total, 0);
    const avgQuoteValue = total > 0 ? quotes.reduce((s, q) => s + q.total, 0) / total : 0;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentQuotes = quotes.filter((q) => new Date(q.created_at) >= last30Days);
    const recentAccepted = recentQuotes.filter((q) => q.status === "accepted").length;

    const quotesByStatus = [
      { name: "Draft", value: quotes.filter((q) => q.status === "draft").length },
      { name: "Sent", value: quotes.filter((q) => q.status === "sent").length },
      { name: "Opened", value: quotes.filter((q) => q.status === "opened").length },
      { name: "Accepted", value: accepted },
      { name: "Lost", value: lost },
    ].filter((s) => s.value > 0);

    const monthlyRevenue: Record<string, number> = {};
    quotes.filter((q) => q.status === "accepted").forEach((q) => {
      const month = new Date(q.created_at).toLocaleString("default", { month: "short", year: "2-digit" });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + q.total;
    });

    return success({
      totals: { total, accepted, lost, pending },
      revenue: { total: totalRevenue, avgQuoteValue },
      winRate,
      recentAccepted,
      quotesByStatus,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
    });
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
