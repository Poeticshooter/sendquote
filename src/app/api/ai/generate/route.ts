import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
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
    Sentry.captureException(e);
    return parseError(e);
  }
}
