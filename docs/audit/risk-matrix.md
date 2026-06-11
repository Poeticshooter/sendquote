# Risk Matrix

| ID | Issue | P-Rank | Severity | Revenue Impact | Security Impact | Data Risk | Fix Complexity | Fix Time |
|---|---|---|---|---|---|---|---|---|
| B-001 | Plan Mismatch (Starter vs Free) | **P0** | HIGH | DIRECT LOSS | None | None | MEDIUM | 1h |
| D-006 | CSRF Token Never Issued | **P0** | HIGH | OPERATIONAL | HIGH | None | MEDIUM | 2h |
| D-001 | Rate Limiting Non-Functional | **P0** | CRITICAL | INDIRECT | CRITICAL | None | LOW | 30m |
| B-005 | Follow-ups Never Schedule | **P0** | HIGH | INDIRECT | None | None | LOW | 15m |
| B-004 | Acceptance Partial Failure | **P0** | HIGH | DIRECT LOSS | None | HIGH | MEDIUM | 2h |
| B-003 | Sent Before Email Confirmed | **P0** | HIGH | DIRECT LOSS | None | None | LOW | 30m |
| ISS-001 | Secrets in .env.local | **P0** | CRITICAL | None | CRITICAL | CRITICAL | MEDIUM | 1h |
| ISS-008 | TS Errors Hidden Locally | **P0** | HIGH | None | MEDIUM | MEDIUM | LOW | 5m |
| R-002 | plan_expiry Never Set | **P0** | HIGH | DIRECT LOSS | None | HIGH | LOW | 30m |
| W-001 | Google OAuth Profile Gap | **P0** | HIGH | USER LOSS | None | None | UNKNOWN | UNKNOWN |

| ID | Issue | P-Rank | Severity | Revenue Impact | Security Impact | Data Risk | Fix Complexity | Fix Time |
|---|---|---|---|---|---|---|---|---|
| B-002 | Counter Incremented Before Save | **P1** | MEDIUM | None | None | MEDIUM | LOW | 15m |
| B-006 | No Welcome Email | **P1** | MEDIUM | INDIRECT | None | None | LOW | 30m |
| B-007 | No Acceptance Notification | **P1** | MEDIUM | INDIRECT | None | None | LOW | 30m |
| R-001 | No Payment Reconciliation | **P1** | HIGH | DIRECT LOSS | None | HIGH | MEDIUM | 4h |
| R-003 | No Failed Payment Dunning | **P1** | MEDIUM | DIRECT LOSS | None | None | MEDIUM | 2h |
| R-005 | Misleading "Start Free Trial" | **P1** | MEDIUM | INDIRECT | None | None | MEDIUM | 2h |
| R-006 | Pricing vs Code Plan Mismatch | **P1** | MEDIUM | INDIRECT | None | None | MEDIUM | 1h |
| D-003 | generateQuoteNumber_auto Missing | **P1** | MEDIUM | None | None | LOW | LOW | 15m |
| ISS-005 | Full Mock Testing | **P1** | MEDIUM | None | None | MEDIUM | HIGH | 8h+ |
| CSP-002 | Razorpay Forms Blocked | **P1** | MEDIUM | OPERATIONAL | None | None | LOW | 15m |

| ID | Issue | P-Rank | Severity | Fix Complexity | Fix Time |
|---|---|---|---|---|---|
| D-002 | create_quote_with_items No-Op | **P2** | LOW | LOW | 30m |
| D-004 | No public_token Unique Constraint | **P2** | LOW | LOW | 15m |
| D-005 | No FK quotes→profiles | **P2** | LOW | LOW | 15m |
| D-007 | Discount Fields Missing from UI | **P2** | LOW | LOW | 1h |
| R-004 | Coupons Dead Code | **P3** | LOW | LOW | 15m |
| O-003 | Build Memory Limit Not in Vercel | **P3** | LOW | LOW | 5m |
| C-001 | VOICE_REVENUE/VOICE_USERS | **P3** | LOW | LOW | 5m |
