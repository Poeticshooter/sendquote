# SendQuote Implementation Plan

> 11-phase lifecycle for systematic project improvement.
> Each phase builds on the previous. Skip completed phases.

---

## Phase 1: Foundation & Project Setup

**Goal**: Establish tooling, quality gates, and developer environment.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 1.1 | Verify pnpm workspace is correct | `pnpm` | 5 min | High |
| 1.2 | Lock ESLint rules to match project patterns | `tools-eslint` | 30 min | High |
| 1.3 | Add lint-staged with pre-commit hook | `lint-and-validate` | 20 min | Medium |
| 1.4 | Create AGENTS.md (already exists — verify/update) | `generate-agents-md` | 15 min | Medium |
| 1.5 | Add post-create script for devcontainer | `dev-loop-dev-container` | 30 min | Low |
| 1.6 | Configure commitlint with husky | `dev-loop-git-workflow` | 15 min | Medium |

**Definition of Done**: `pnpm lint` passes, commit messages enforced, AGENTS.md accurate.

---

## Phase 2: Architecture & Planning

**Goal**: Document architecture decisions, plan features before building.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 2.1 | Write ADR for AI provider chain architecture | `solution-architecture` | 30 min | Medium |
| 2.2 | Write ADR for database rate limiting strategy | `solution-architecture` | 20 min | Medium |
| 2.3 | Document API route conventions in AGENTS.md | `api-and-interface-design` | 15 min | Low |
| 2.4 | Review clean architecture compliance in lib/ | `backend-universal-clean-architecture` | 45 min | Low |
| 2.5 | Create template for new feature plans | `plan-writing` | 15 min | Low |

**Definition of Done**: ADRs committed, planning template in docs/.

---

## Phase 3: Frontend Development

**Goal**: Build UI following Next.js 16 + React 19 + Tailwind 4 best practices.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 3.1 | Audit all `"use client"` directives — minimize | `frontend-react-nextjs` | 30 min | High |
| 3.2 | Replace `var()` in className with Tailwind v4 CSS-first config | `tailwind-4` | 20 min | Medium |
| 3.3 | Audit font loading (swap + preload critical fonts) | `frontend-universal-performance` | 15 min | Medium |
| 3.4 | Verify image optimization (next/image, WebP, srcset) | `frontend-universal-image-optimization` | 20 min | Medium |
| 3.5 | Add missing loading skeletons (not just spinner) | `react` | 30 min | Medium |
| 3.6 | Audit aria labels and keyboard navigation | `frontend-universal-accessibility` | 45 min | High |
| 3.7 | Add responsive container queries where needed | `frontend-universal-responsive-design` | 20 min | Low |
| 3.8 | Audit error boundaries at route group level | `frontend-universal-error-handling` | 15 min | Medium |
| 3.9 | Wire Sentry.captureException into error.tsx | `frontend-universal-error-handling` | 5 min | **Critical** |

**Definition of Done**: All `"use client"` justified, a11y audit clean, error boundary catches + reports.

---

## Phase 4: Backend Development

**Goal**: Strengthen API layer, database, auth, and background jobs.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 4.1 | Switch rate limiting from memory fallback to DB-only | `backend-universal-rate-limiting` | 20 min | **Critical** |
| 4.2 | Enable AI cache table (migration exists, not wired) | `supabase` | 30 min | **Critical** |
| 4.3 | Add database response caching for frequent queries | `backend-universal-caching` | 45 min | Medium |
| 4.4 | Extract reusable API middleware (auth, validation, rate limit) | `backend-universal-api-design` | 30 min | Medium |
| 4.5 | Add structured logging with correlation IDs | `backend-universal-structured-logging` | 30 min | Medium |
| 4.6 | Add request ID to all API responses | `backend-universal-api-response` | 15 min | Low |
| 4.7 | Verify all API routes return consistent error envelopes | `backend-universal-api-response` | 30 min | Medium |
| 4.8 | Add pagination envelope to list endpoints | `backend-universal-api-design` | 45 min | Medium |
| 4.9 | Add retry with backoff for AI provider calls | `backend-universal-resilience-patterns` | 30 min | Medium |
| 4.10 | Add circuit breaker timeout for third-party APIs | `backend-universal-resilience-patterns` | 20 min | Low |

**Definition of Done**: Rate limiting DB-only, AI cache live, all errors consistent, correlation IDs in logs.

---

## Phase 5: AI Integration

**Goal**: Improve AI quote generation quality, reduce costs, add fallback reliability.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 5.1 | Wire AI cache into generateQuoteAI (table exists, code unused) | `ai-cost-optimization` | 20 min | **Critical** |
| 5.2 | Add prompt caching headers to Groq provider | `claude-api` | 15 min | Medium |
| 5.3 | Add response schema validation (Zod) for AI output parsing | `ai-ai-testing` | 20 min | Medium |
| 5.4 | Rate-limit AI generation per user (cost control) | `backend-universal-rate-limiting` | 15 min | Medium |
| 5.5 | Add AI provider health check in /api/health | `ai-sdk` | 15 min | Low |
| 5.6 | Add streaming support for quote generation (UX) | `ai-sdk` | 45 min | Low |
| 5.7 | Add model fallback metrics to Sentry | `ai-sdk` | 15 min | Low |

**Definition of Done**: AI cache reducing API calls, schema-validated output, rate-limited per user.

---

## Phase 6: Testing & Quality

**Goal**: Expand test coverage, add E2E tests, enforce quality gates.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 6.1 | Add test for auth middleware (middleware.ts) | `backend-universal-testing` | 30 min | High |
| 6.2 | Add test for CSRF verification | `backend-universal-testing` | 15 min | Medium |
| 6.3 | Add test for cron secret verification | `backend-universal-testing` | 15 min | Medium |
| 6.4 | Add test for plan gates enforcement | `backend-universal-testing` | 20 min | Medium |
| 6.5 | Add E2E test for quote creation flow | `e2e-testing` | 60 min | Medium |
| 6.6 | Add E2E test for deal room acceptance | `e2e-testing` | 45 min | Medium |
| 6.7 | Run E2E in CI pipeline | `devops-github-actions` | 30 min | Medium |
| 6.8 | Add Lighthouse CI run to CI pipeline | `perf-lighthouse` | 20 min | Medium |
| 6.9 | Increase unit test coverage to 80%+ on core lib/ | `testing-patterns` | 120 min | Medium |

**Definition of Done**: E2E tests run in CI, Lighthouse gates enforced, coverage > 60%.

---

## Phase 7: Security

**Goal**: Audit and harden security posture.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 7.1 | Audit CSP headers — verify all origins whitelisted | `frontend-universal-security` | 15 min | High |
| 7.2 | Verify CSRF covers all state-changing routes | `frontend-universal-security` | 20 min | High |
| 7.3 | Add rate limiting for auth endpoints (login/signup) | `backend-universal-rate-limiting` | 15 min | High |
| 7.4 | Verify webhook secret rotation process | `backend-universal-webhooks` | 10 min | Medium |
| 7.5 | Run dependency audit (pnpm audit --audit-level=high) | `dependency-audit` | 10 min | **Critical** |
| 7.6 | Set up Dependabot for automated dependency updates | `devops-github-actions` | 15 min | High |
| 7.7 | Add Secrets detection in CI (trufflehog or similar) | `devops-github-actions` | 20 min | Medium |
| 7.8 | Audit database RLS policies for all tables | `supabase` | 30 min | Medium |

**Definition of Done**: No high/critical dependency vulns, Dependabot configured, RLS complete.

---

## Phase 8: Performance

**Goal**: Optimize Core Web Vitals, bundle size, and database queries.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 8.1 | Run Lighthouse audit, fix scores below 90 | `perf-lighthouse` | 60 min | High |
| 8.2 | Analyze bundle with next/bundle-analyzer | `perf-web-optimization` | 20 min | Medium |
| 8.3 | Add missing lazy loading for heavy components | `frontend-universal-performance` | 30 min | Medium |
| 8.4 | Audit slow Supabase queries (pg_stat_statements) | `database-optimizer` | 30 min | Medium |
| 8.5 | Add missing database indexes from query patterns | `database-design` | 20 min | Medium |
| 8.6 | Add preconnect hints for third-party origins | `frontend-universal-performance` | 10 min | Low |
| 8.7 | Optimize fonts (subsetting, preload) | `perf-web-optimization` | 15 min | Low |

**Definition of Done**: Lighthouse scores >= 90 across all categories, CLS < 0.1.

---

## Phase 9: SEO & Analytics

**Goal**: Maximize organic discovery and understand user behavior.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 9.1 | Verify JSON-LD structured data renders correctly | `schema-markup` | 15 min | High |
| 9.2 | Add breadcrumb structured data to all pages | `frontend-universal-seo` | 20 min | Medium |
| 9.3 | Add FAQPage schema to pricing page | `schema-markup` | 15 min | Medium |
| 9.4 | Verify sitemap covers all indexable pages | `frontend-universal-seo` | 15 min | Medium |
| 9.5 | Add event tracking for key user actions in PostHog | `product-analytics` | 30 min | Medium |
| 9.6 | Set up conversion goals in PostHog | `product-analytics` | 20 min | Medium |
| 9.7 | Add llms.txt endpoint (already exists — verify) | `geo-fundamentals` | 10 min | Low |
| 9.8 | Add AI crawler optimizations for LLM discovery | `geo-fundamentals` | 20 min | Low |

**Definition of Done**: Structured data valid, sitemap complete, conversion tracking live.

---

## Phase 10: Deployment, DevOps & Monitoring

**Goal**: Production-grade deployment pipeline, SLOs, and incident response.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 10.1 | Add error budget SLO tracking (99.5% uptime) | `sre-engineer` | 30 min | Medium |
| 10.2 | Create incident response runbook template | `devops-incident-response` | 30 min | Medium |
| 10.3 | Add automated rollback script to package.json | `deployment-procedures` | 5 min | Medium |
| 10.4 | Add deployment smoke test to CI | `devops-github-actions` | 20 min | Medium |
| 10.5 | Set up Sentry alert rules for high error rates | `sentry` | 15 min | Medium |
| 10.6 | Add distributed tracing headers in API responses | `backend-universal-observability` | 15 min | Low |
| 10.7 | Create health dashboard in BetterStack | `devops-monitoring` | 20 min | Low |
| 10.8 | Document database backup/recovery procedure | `sre-engineer` | 15 min | Low |
| 10.9 | Add Supabase schema dump to version-controlled migration | `database-migration` | 15 min | **Critical** |

**Definition of Done**: Rollback script exists, runbook in docs/, SLO tracked, initial schema in migrations.

---

## Phase 11: Maintenance & Technical Debt

**Goal**: Systematic debt reduction and ongoing project health.

| # | Task | Skill | Effort | Priority |
|---|------|-------|--------|----------|
| 11.1 | Catalog existing tech debt items | `dev-loop-tech-debt-tracker` | 30 min | High |
| 11.2 | Remove dead code (unused components, dead API routes) | `refactoring-analysis` | 45 min | Medium |
| 11.3 | Standardize error handling across all 42 API routes | `backend-universal-api-design` | 60 min | Medium |
| 11.4 | Deduplicate client/validation logic | `refactoring-analysis` | 30 min | Medium |
| 11.5 | Remove inline `any` casts (verify `strict: true`) | `typescript-advanced` | 20 min | Medium |
| 11.6 | Add conventional-changelog for release notes | `dev-loop-changelog-generator` | 15 min | Low |
| 11.7 | Update README with current feature set | `dev-loop-readme-writer` | 20 min | Low |
| 11.8 | Document deployment and rollback in DEVGUIDE.md | `docs-writer` | 15 min | Low |

**Definition of Done**: Tech debt backlog exists, no dead code, consistent error handling across all routes.

---

## Priority Summary

| Priority | Count | Action |
|----------|-------|--------|
| **Critical** | 6 | Do immediately (next session) |
| **High** | 14 | Do this week |
| **Medium** | 39 | Do this sprint |
| **Low** | 16 | Schedule when convenient |

### Critical items (immediate):

1. **Phase 3.9** — Wire Sentry into error.tsx (5 min)
2. **Phase 4.1** — Switch rate limiting to DB-only (20 min)
3. **Phase 4.2** — Enable AI cache (30 min)
4. **Phase 5.1** — Wire AI cache into generateQuoteAI (20 min)
5. **Phase 7.5** — Run dependency audit (10 min)
6. **Phase 10.9** — Dump initial schema into migration (15 min)

Total critical time: **~100 minutes** — one focused session.
