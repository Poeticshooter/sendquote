import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getQuote, updateQuoteStatus } from "@/lib/supabase/queries";
import { UpdateQuoteStatusSchema } from "@/lib/api-validation";
import { success, parseError, requireAuth } from "@/lib/api-helper";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const quote = await getQuote(id);
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    return success(quote);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { status } = UpdateQuoteStatusSchema.parse(body);
    const quote = await updateQuoteStatus(id, status);
    return success(quote);
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const supabase = await createClient();
    const { data: quote } = await supabase
      .from("quotes")
      .select("user_id, status")
      .eq("id", id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.user_id !== user.id) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    // Soft-delete: mark as deleted, never hard-remove for audit trail
    const { error } = await supabase
      .from("quotes")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), status: "archived" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    Sentry.captureException(e);
    return parseError(e);
  }
}
