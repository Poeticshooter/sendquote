import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { success, parseError, requireAuth } from "@/lib/api-helper";
import { NextRequest } from "next/server";

const DateQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T|$)/, "startDate must be a valid ISO date").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T|$)/, "endDate must be a valid ISO date").optional(),
});

const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const rawStartDate = searchParams.get("startDate");
    const rawEndDate = searchParams.get("endDate");

    const parsed = DateQuerySchema.safeParse({ startDate: rawStartDate, endDate: rawEndDate });
    if (!parsed.success) {
      return success({ totals: { total: 0, accepted: 0, lost: 0, pending: 0 }, revenue: { total: 0, avgQuoteValue: 0 } });
    }
    const { startDate, endDate } = parsed.data;

    const pagination = PaginationSchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    // Get total count for pagination metadata
    let countQuery = supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (startDate) {
      countQuery = countQuery.gte("created_at", startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte("created_at", endDate);
    }

    const { count: totalQuotes } = await countQuery;

    let query = supabase
      .from("quotes")
      .select("id, status, total, created_at, client_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(pagination.offset, pagination.offset + pagination.limit - 1);

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: quotes } = await query;

    if (!quotes) return success({ totals: { total: 0, accepted: 0, lost: 0, pending: 0 }, revenue: { total: 0, avgQuoteValue: 0 }, pagination: { total: 0, limit: pagination.limit, offset: pagination.offset, hasMore: false } });

    const total = quotes.length;
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    const lost = quotes.filter((q) => q.status === "lost" || q.status === "expired").length;
    const pending = quotes.filter((q) => q.status === "sent" || q.status === "opened").length;
    const totalRevenue = quotes.filter((q) => q.status === "accepted").reduce((s, q) => s + (Number(q.total) || 0), 0);
    const avgQuoteValue = total > 0 ? quotes.reduce((s, q) => s + (Number(q.total) || 0), 0) / total : 0;
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
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (Number(q.total) || 0);
    });

    const totalCount = totalQuotes ?? 0;

    return success({
      totals: { total, accepted, lost, pending },
      revenue: { total: totalRevenue, avgQuoteValue },
      winRate,
      recentAccepted,
      quotesByStatus,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      pagination: {
        total: totalCount,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: pagination.offset + pagination.limit < totalCount,
      },
    });
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
