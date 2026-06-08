/**
 * Runtime environment variable validation.
 * Fails fast with clear error message if required vars are missing.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "GROQ_API_KEY",
  "RESEND_API_KEY",
] as const;

function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key] === "placeholder") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in .env.local or your deployment environment."
    );
  }
}

// Run validation eagerly on module load in server environments
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (e) {
    console.error("[Config]", (e as Error).message);
  }
}

export { validateEnv };
