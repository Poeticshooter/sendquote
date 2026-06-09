import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}/login?confirmed=true`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
