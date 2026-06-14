import type { NextRequest } from "next/server";
import { success, parseError } from "@/lib/api-helper";
import { validateGstFormat, getStateCode, STATE_CODES } from "@/lib/gst";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const gst = request.nextUrl.searchParams.get("gst");
    if (!gst) return success({ error: "GST number required" }, 400);

    const formatted = gst.toUpperCase().trim();
    const result = validateGstFormat(formatted);

    if (!result.valid) {
      return success({ valid: false, reason: result.reason, formatted });
    }

    const stateCode = getStateCode(formatted);
    return success({
      valid: true,
      formatted,
      stateCode,
      stateName: stateCode ? STATE_CODES[stateCode] || "Unknown" : null,
    });
  } catch (e) {
    return parseError(e);
  }
}
