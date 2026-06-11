# Unknown Findings — Requires Further Investigation

---

## UNKNOWN: W-001 — Does Google OAuth Callback Create Profile?

**Issue**: Google OAuth signup flow may not create a profile row.

**Evidence Gap**:
- `src/app/(auth)/signup/page.tsx:92-103` — Google OAuth initiated, redirects to `/auth/callback`
- `src/app/auth/callback/` exists but file content was not fully inspected
- The signup-profile API has a `{userId, email, businessName}` branch for this purpose

**Required Investigation**: Read `src/app/auth/callback/route.ts` to determine if it calls the profile creation API.

**Risk**: HIGH — Without profile creation, Google auth users get infinite dashboard redirect loop.

---

## UNKNOWN: C-004 — Voice Assistant Wrapper Behavior

**Issue**: `voice-assistant-wrapper.tsx` is imported in the root layout. Behavior for unauthenticated/unonboarded users.

**Evidence**: The wrapper lazy-loads `VoiceAssistant` which is auth-gated internally. But the wrapper itself has no auth check and is always rendered.

**Risk**: LOW — VoiceAssistant component checks auth internally before API calls.

---

## UNKNOWN: F-001 — Quote Edit Flow Status

**Issue**: `/quotes/[id]/edit/` directory exists. The quote type defines `version` and `parent_quote_id`. But no "Edit" button is visible in the quote detail page.

**Required Investigation**: Read `src/app/(dashboard)/quotes/[id]/edit/page.tsx` to determine implementation status.

**Risk**: MEDIUM — Incomplete edit feature may allow quote versioning bypass.

---

## UNKNOWN: R-001 (Webhook Gap Analysis)

**Issue**: What happens when Razorpay webhooks are missed? The system logs webhook events but has no replay mechanism.

**Evidence**: `src/app/api/webhook/razorpay/route.ts:39-48` — deduplication exists (checks for existing `razorpay_event_id`). But no replay mechanism for missed webhooks.

**Risk**: HIGH — Missed webhooks cause payment/status discrepancies permanently.

---

## UNKNOWN: Migration Order

**Issue**: Migration files are named by date but `000000_initial_schema.sql` is empty. The actual schema must come from somewhere — possibly created outside the migration system.

**Required Investigation**: Check Supabase project for applied migrations and compare with local files. Look for `supabase/config.toml` for DB connection.

**Risk**: HIGH — Schema drift between environments.
