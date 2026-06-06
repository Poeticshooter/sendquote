import { NextRequest, NextResponse } from "next/server";
import { generateQuoteAI } from "@/lib/ai/generate-quote";

export async function POST(request: NextRequest) {
  try {
    const { description, industry } = await request.json();

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const result = await generateQuoteAI(description);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
