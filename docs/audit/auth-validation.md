# Auth Flow Validation

## Signup Flow (Email/Password)

| Step | Status | Evidence |
|---|---|---|
| User submits form | ✅ | `signup/page.tsx:38-89` — handleSignup() |
| Turnstile verification | ✅ | `signup/page.tsx:43-55` — optional, skipped if no token |
| supabase.auth.signUp() | ✅ | `signup/page.tsx:57-61` — creates auth.users |
| Profile creation via API | ✅ | `signup/page.tsx:72-78` — POST /api/auth/signup-profile |
| Profile row inserted | ✅ | `signup-profile/route.ts:89-98` — upserts with plan:"free" |
| Redirect logic | ✅ | `signup/page.tsx:82-89` — to /onboarding if auto-confirmed, /login?email= if not |
| Welcome email | ❌ **FAIL** | Template exists at `templates.ts:235`, NEVER CALLED |

## Google OAuth Flow

| Step | Status | Evidence |
|---|---|---|
| User clicks Google button | ✅ | `signup/page.tsx:92-103` — initiates OAuth |
| State cookie set | ✅ | `signup/page.tsx:94` — CSRF protection via oauth_state |
| Redirect to callback | ✅ | `signup/page.tsx:98` — /auth/callback |
| Code exchange | ✅ | `auth/callback/route.ts:27` — exchangeCodeForSession |
| Profile existence check | ✅ | `auth/callback/route.ts:33-37` — checks if profile exists |
| Profile creation (if missing) | ✅ | `auth/callback/route.ts:44-52` — creates with plan:"free" |
| Redirect to dashboard | ✅ | `auth/callback/route.ts:62` — redirects to /dashboard or /onboarding |

## Auth Enforcement

| Layer | Status | Evidence |
|---|---|---|
| Middleware auth guard | ✅ | `middleware.ts:79-84` — redirects to /login if no user |
| API route auth | ✅ | `api-helper.ts:48-53` — requireAuth() used in all protected routes |
| Public paths whitelist | ✅ | `middleware.ts:7-11` + lines 52-55 — marketing pages, auth, /q/ |
| Session cookie handling | ✅ | `middleware.ts:69-77` — Supabase SSR cookie management |

## Gap: Missing Welcome Email

**Severity**: P2
**Evidence**: `signupWelcomeEmail` and `welcomeEmail` functions defined in `templates.ts` but called nowhere in the codebase. New users receive zero onboarding communication.

## Result
**Auth flow is functional. No critical blockers. One UX gap (welcome email).**
