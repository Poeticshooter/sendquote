import { createAdminClient } from "@/lib/supabase/admin";

const CACHE_TTL_HOURS = 24;

import crypto from "crypto";

function hash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 32);
}

export async function getCachedResponse(
  prompt: string,
  system: string,
): Promise<string | null> {
  try {
    const promptHash = hash(prompt);
    const systemHash = hash(system);
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("ai_cache")
      .select("response")
      .eq("prompt_hash", promptHash)
      .eq("system_hash", systemHash)
      .gte(
        "created_at",
        new Date(Date.now() - CACHE_TTL_HOURS * 3_600_000).toISOString(),
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.response || null;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  prompt: string,
  system: string,
  response: string,
  provider: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_cache").insert({
      prompt_hash: hash(prompt),
      system_hash: hash(system),
      response,
      provider,
    });
  } catch {
    // Cache write failures are non-critical
  }
}
