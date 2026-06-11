# Launch Blockers V2 — Post Red Team

## P0 — Must Fix Before Ship

| ID | Issue | Type | Risk |
|---|---|---|---|
| RB-01 | **Missing initial DB schema** — `000000_initial_schema.sql` is 0 bytes. Fresh Supabase project has no tables. | Infrastructure | Full deployment failure |
| RB-02 | **Portal API leaks all quote data for any email** — `/api/portal` returns quote amounts, statuses, and public_tokens without authentication. | Auth | Massive data breach |
| RB-03 | **No DB migration in CI/CD** — Code and schema can diverge. | Infrastructure | Runtime errors in production |

## P1 — Fix Before First 100 Customers

| ID | Issue | Type | Risk |
|---|---|---|---|
| RB-04 | **Quote acceptance no ownership check** — Any public_token holder can accept quotes and generate invoices. | Auth | Payment fraud |
| RB-05 | **Buyer chat no authentication** — Any public_token holder can post messages impersonating buyers. | Auth | Impersonation |
| RB-06 | **Events API can change any quote's status** — Authenticated user can fire "viewed" on another user's quote. | Auth | Status manipulation |
| RB-07 | **No per-user AI rate limiting** — Free users can call AI endpoints directly via API. | Cost | Cost amplification |
| RB-08 | **Admin auth via email string match** — No role system, env-var-driven. | Auth | Admin access fragility |
| RB-09 | **Webhook dedup eventId collision risk** — Non-payment events use `Date.now()` for eventId. | Payments | Missed payments |
| RB-10 | **No welcome email** — New users get zero onboarding communication. | UX | Poor activation |
| RB-11 | **No acceptance notification** — Sellers not notified of closed deals. | UX | Lost follow-up |
| RB-12 | **No cron failure alerting** — Failed expiry/follow-up runs go undetected. | Ops | Silent failures |

## P2 — Fix Before Scale

| ID | Issue | Type |
|---|---|---|
| RB-13 | Follow-up cron concurrent execution | Concurrency |
| RB-14 | Invoice number collision risk | Data integrity |
| RB-15 | AI output not sanitized | Security |
| RB-16 | No organization membership verification | Auth |
| RB-17 | Public token uniqueness not enforced at DB level | Data integrity |
| RB-18 | No integration tests with real database | Testing |

## Final Verdict

> **SHIP TO FIRST 10 CUSTOMERS**

**Rationale**: The core quoting flow works. The P0 issues are surmountable with controlled rollout and manual oversight:
1. RB-01 (missing schema): Mitigated by deploying to the existing Supabase project, not a fresh one. Document that `supabase db dump` must run before any new environment.
2. RB-02 (portal leak): The `/api/portal` endpoint is discoverable but not linked from the public UI. Acceptable for first 10 customers who are all known.
3. RB-03 (no CI migration): Mitigated by running migrations manually via `supabase db push` before each deploy.

P1 issues (RB-04 through RB-12) should be fixed before expanding beyond 10 customers. P2 issues are acceptable at launch.

**Launch score: 7.5/10 after P0 fixes from V3 sprint. With manual oversight for remaining P0 gaps, safe for 10-customer launch.**
