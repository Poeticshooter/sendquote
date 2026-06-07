import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface ApiError {
  error: string;
  details?: unknown;
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ error, ...(details ? { details } : {}) } as ApiError, { status });
}

export function parseError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    return apiError("Validation failed", 400, e.issues.map((err) => ({
      path: String(err.path.join(".")),
      message: err.message,
    })));
  }
  if (e instanceof Error) {
    const message = e.message;
    if (message.includes("Not authenticated")) return apiError("Not authenticated", 401);
    if (message.includes("Not authorized")) return apiError("Not authorized", 403);
    if (message.includes("not found") || message.includes("No quote")) return apiError(message, 404);
    console.error("API Error:", e);
    return apiError("Internal server error", 500);
  }
  console.error("Unknown API error:", e);
  return apiError("Internal server error", 500);
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSafe<T>(schema: ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: ZodError } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}
