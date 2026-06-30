import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  GROQ_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  TURNSTILE_SECRET_KEY: z.string().optional(),

  SENTRY_AUTH_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

  VERCEL_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_FORMBRICKS_ENV_ID: z.string().optional(),
  FORMBRICKS_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

let cached: EnvConfig | null = null;
let hasWarned = false;

export function getConfig(): EnvConfig {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `  - ${i.path.join(".")}: ${i.message}`,
    );
    if (!hasWarned) {
      console.warn(`[SendQuote] Environment validation issues:\n${errors.join("\n")}`);
      hasWarned = true;
    }
    cached = parsed.data ?? ({} as EnvConfig);
    return cached;
  }

  const aiKeys = [
    parsed.data.GROQ_API_KEY,
    parsed.data.MISTRAL_API_KEY,
    parsed.data.GEMINI_API_KEY,
    parsed.data.OPENROUTER_API_KEY,
    parsed.data.CEREBRAS_API_KEY,
  ].filter(Boolean);

  if (aiKeys.length === 0 && !hasWarned) {
    console.warn("[SendQuote] No AI provider configured. AI quote generation will use templates only.");
    hasWarned = true;
  }

  cached = parsed.data;
  return cached;
}
