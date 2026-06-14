/**
 * Runtime environment variable validation.
 * Fails fast with clear error message if required vars are missing.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ENCRYPTION_KEY",
] as const;
const OPTIONAL_VARS = [
  "GROQ_API_KEY", "RESEND_API_KEY", "OPENROUTER_API_KEY", "GEMINI_API_KEY",
  "CRON_SECRET", "RAZORPAY_WEBHOOK_SECRET", "HUBSPOT_API_KEY", "PIPEDRIVE_API_KEY",
  "ADMIN_EMAILS",
] as const;

function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config] Missing required environment variables: ${missing.join(", ")}. ` +
      "Set them in .env.local or your deployment environment."
    );
  }

  for (const key of OPTIONAL_VARS) {
    if (!process.env[key]) {
      console.warn(`[Config] Optional env var ${key} is not set. Related features may be unavailable.`);
    }
  }

  return { valid: missing.length === 0, missing };
}

export const config = {
  turnstile: {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    secretKey: process.env.TURNSTILE_SECRET_KEY,
  },
  formbricks: {
    envId: process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID,
  },
};

export { validateEnv };
