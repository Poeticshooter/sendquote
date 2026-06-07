import { NextRequest, NextResponse } from "next/server";
import { generateQuoteAI } from "@/lib/ai/generate-quote";
import { AIGenerateSchema } from "@/lib/api-validation";
import { requireAuth, parseError, success } from "@/lib/api-helper";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const { description } = AIGenerateSchema.parse(body);
    const result = await generateQuoteAI(description);
    return success(result);
  } catch (e) {
    return parseError(e);
  }
}
