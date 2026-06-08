import { NextRequest } from "next/server";
import { success, parseError } from "@/lib/api-helper";
import { lookupPincode } from "@/lib/pincode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const pincode = request.nextUrl.searchParams.get("pincode");
    if (!pincode) return success({ error: "Pincode required" }, 400);

    const result = await lookupPincode(pincode);
    return success(result);
  } catch (e) {
    return parseError(e);
  }
}
