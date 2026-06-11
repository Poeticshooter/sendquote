# Deployment Validation

## Build Verification

| Check | Result | Evidence |
|---|---|---|
| `tsc --noEmit` | ✅ PASS | 0 errors |
| `eslint` | ✅ PASS | 0 errors, 2 pre-existing warnings |
| `vitest run` | ✅ PASS | 122 tests, 9 files |
| `next build` | ✅ PASS | All routes compiled successfully |

## Environment Variables Audit

### Required (validated at startup in config.ts)
| Variable | In .env.example? | In code? |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ |

### Optional (documented in .env.example)
| Variable | In .env.example? | In code? |
|---|---|---|
| GROQ_API_KEY | ✅ | ✅ |
| GEMINI_API_KEY | ✅ | ✅ |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | ✅ | ✅ |
| RAZORPAY_KEY_ID | ✅ | ✅ |
| RAZORPAY_KEY_SECRET | ✅ | ✅ |
| RAZORPAY_WEBHOOK_SECRET | ✅ | ✅ |
| RESEND_API_KEY | ✅ | ✅ |
| NEXT_PUBLIC_SENTRY_DSN | ✅ | ✅ |
| CRON_SECRET | ✅ | ✅ |
| HUBSPOT_API_KEY | ✅ | ✅ |
| PIPEDRIVE_API_KEY | ✅ | ✅ |
| ADMIN_EMAILS | ❌ MISSING | ✅ (config.ts) |
| NEXT_PUBLIC_APP_URL | ✅ | ✅ |

### Used in code but NOT in .env.example
| Variable | Where used | Impact if missing |
|---|---|---|
| OPENROUTER_API_KEY | `ai/providers.ts` | OpenRouter fallback unavailable |
| NEXT_PUBLIC_POSTHOG_KEY | `posthog-provider.tsx` | Product analytics disabled |
| NEXT_PUBLIC_POSTHOG_HOST | `posthog-provider.tsx` | Product analytics disabled |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | `signup/page.tsx` | Bot protection disabled (optional) |
| TURNSTILE_SECRET_KEY | `verify-turnstile/route.ts` | Bot protection disabled |
| NEXT_PUBLIC_FORMBRICKS_ENV_ID | `formbricks-provider.tsx` | Surveys disabled |
| FORMBRICKS_API_KEY | (formbricks API) | Surveys disabled |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | `google-analytics.tsx` | Google Analytics disabled |
| GOOGLE_CLIENT_ID | `auth/callback` | Google OAuth disabled |
| GOOGLE_CLIENT_SECRET | `auth/callback` | Google OAuth disabled |
| VOICE_REVENUE | `voice/route.ts` | Defaults to "Pre-revenue" |
| VOICE_USERS | `voice/route.ts` | Defaults to "Early stage" |
| INDEXNOW_KEY | SEO | IndexNow disabled |

### Gap
13 environment variables used in the codebase are NOT in `.env.local.example`. All have graceful fallbacks (feature disabled or default value), so the application boots without them. A new engineer would need to discover these from reading the code.

## Deployment Checklist

| Step | Status |
|---|---|
| Install pnpm dependencies | ✅ `pnpm install` |
| TypeScript check | ✅ `pnpm typecheck` |
| Lint | ✅ `pnpm lint` |
| Unit tests | ✅ `pnpm test` |
| Build | ✅ `pnpm build` |
| Apply DB migrations | ⚠️ Manual: `npx supabase db push` |
| Configure env vars | ⚠️ 13 undocumented vars |
| Deploy to Vercel | ✅ `vercel --prod` |

## Result
**Build pipeline verified. TypeScript, ESLint, tests, and production build all pass. 13 undocumented env vars exist but have graceful fallbacks. Acceptable for first 10 customers.**
