# SendQuote False Positives

Issues from V1/V2 that were disproven or partially incorrect.

---

## FALSE POSITIVE: C-002 — ADMIN_EMAILS "Never Used"

**Original Claim**: `ADMIN_EMAILS` env var is listed in config.ts but never read by any code.

**Verdict**: FALSE POSITIVE

**Evidence**:
- `src/app/api/admin/stats/route.ts:11`:
  ```typescript
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(...)
  ```
- Line 12: `if (adminEmails.length === 0 || !adminEmails.includes(user.email?.toLowerCase() || ""))`
- The variable IS used to gate access to the admin stats endpoint

**Correction**: ADMIN_EMAILS is used for admin authorization. However, it's only consumed by the stats endpoint — other admin pages (users, logs) use different auth mechanisms or no admin gating.

---

## PARTIAL FALSE POSITIVE: F-003 — Admin Audit Log Has No Write Path

**Original Claim**: No code writes to `admin_audit_log`.

**Verdict**: PARTIAL FALSE POSITIVE

**Evidence**:
- `src/app/api/admin/stats/route.ts:23-28`:
  ```typescript
  await admin.from("admin_audit_log").insert({
    admin_user_id: user.id,
    admin_action: "view_admin_stats",
    ...
  });
  ```
  One write path exists: when admin views stats.

**Correction**: The audit log IS written for stats access. But it's NOT written for other admin actions (user management, log viewing, etc.). The finding should be refined to: "Incomplete admin audit trail — only stats viewing is logged."

---

## PARTIAL FALSE POSITIVE: W-001 — Google OAuth Profile Creation

**Original Claim**: Google OAuth may not create a profile.

**Verdict**: CANNOT FULLY VERIFY without inspecting `/auth/callback` handler

**What we know**:
- Signup page initiates Google OAuth → `/auth/callback`
- The callback handler COULD call the signup-profile API
- The API's third Zod branch accepts `{userId, email, businessName}` for this purpose
- The callback handler file was not fully inspected (only directory listing confirms it exists)

**Risk remains**: If callback does NOT call the API, users are stuck in a redirect loop. But we lack evidence to confirm either way. Reclassify to UNKNOWN.

---

## PARTIAL FALSE POSITIVE: V1 — CSRF Protection is "Broken"

**Original V1 Claim**: CSRF protection is broken.

**Verdict**: The mechanism is technically implemented but has a critical gap.

**What's correct**:
- CSRF verification code exists and is correct (`timingSafeEqual`, origin verification)
- The middleware DOES call it for state-changing requests
- Whitelist correctly exempts webhooks/public endpoints

**What was wrong in "completely broken" characterization**:
- The CSRF cookie must be SET somewhere for the mechanism to work
- No code sets the cookie — this IS a bug
- But the whitelist at middleware.ts:38-44 covers all the production-critical endpoints (webhooks, quote acceptance, buyer chat)
- The core quoting API (CRUD, sending, AI) would fail because they're NOT whitelisted

**Refined finding**: CSRF checking is active but the token is never issued, so all non-whitelisted endpoints fail. This is a real bug but partially mitigated by the whitelist.
