import { NextRequest, NextResponse } from "next/server";
import { getQuote, updateQuoteStatus } from "@/lib/supabase/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    return NextResponse.json(quote);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.status) {
      const quote = await updateQuoteStatus(id, body.status);
      return NextResponse.json(quote);
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
