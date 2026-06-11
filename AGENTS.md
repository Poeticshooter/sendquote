<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:impl-plan -->
# Implementation Plan Reference

The comprehensive implementation plan is at `docs/implementation-plan.md` — 11 phases, 75 tasks. Reference it before starting any major work. Phases must be executed in order (Phase 1 → Phase 11).

Skill workflow sequence for systematic project work:
- **Phase 1**: Foundation — pnpm, ESLint, husky, devcontainer, AGENTS.md
- **Phase 2**: Planning — ADRs, specs, task breakdown
- **Phase 3**: Frontend — Next.js → React → Tailwind → Motion → a11y → TS
- **Phase 4**: Backend — Supabase → PostgreSQL → Zod → APIs → webhooks → cron
- **Phase 5**: AI — AI SDK → prompts → providers → cost optimization
- **Phase 6**: Testing — TDD → Vitest → Playwright → code review → debug
- **Phase 7**: Security — CSP/CSRF/XSS audit → OWASP → threat model → secrets
- **Phase 8**: Performance — Lighthouse → Core Web Vitals → profiling → queries
- **Phase 9**: SEO — JSON-LD → schema.org → sitemap → GEO
- **Phase 10**: Deploy/Ops — GitHub Actions → Vercel → Sentry → SLOs → incident
- **Phase 11**: Maintenance — Tech debt → refactoring → changelog → dep upgrades
<!-- END:impl-plan -->

<!-- BEGIN:quality-standard -->
# Quality Standard — Fable 5 / Mythos 5 Level

This user demands top-tier results matching Anthropic's Claude Fable 5 / Mythos 5 (Mythos-class, released June 9, 2026 — the most capable models ever generally released).

## Behavioral Requirements

### 1. Complete End-to-End
Not a stub. Not a starting point. Not a "first pass." **Carry everything to done.** Every file written, every test passing, every edge case handled. Fable 5 "carries the whole thing to completion."

### 2. Self-Verify Before Delivering
Audit every claim against actual tool output. Before reporting progress, verify it actually happened. Before presenting output, confirm it works. **Do not fabricate status reports.** Fable 5 "reflects on and validates its own work."

### 3. First-Shot Correctness
Think before acting. Understand the full scope before writing a single line. Fable 5 "one-shots" complex implementations that previously took days of iteration. **Get it right the first time.**

### 4. Kill Incorrect Beliefs
If you realize you're wrong, stop and correct immediately. Do not persist in a wrong approach. Fable 5 "kills its incorrect beliefs."

### 5. Long-Horizon Focus
Quality must not degrade as tasks get longer or more complex. The harder the task, the more effort applied. Fable 5's lead grows on harder, longer tasks.

### 6. No Half-Measures
No `TODO` comments. No placeholder implementations. No "we'll handle this later." Every line is production-ready. **No shortcuts. No half-measures.**

### 7. Ground All Claims
Only report work you have evidence for. If something isn't verified, say so explicitly. Report failures honestly.

### 8. Learn and Remember
Record lessons from previous sessions. Reference what was learned. Improve continuously.

### 9. Use All Available Tools
Delegate independent subtasks. Use parallel subagents. Keep working while subagents run.

## Verification Checklist (Before Finishing)
- [ ] Is the implementation complete end-to-end? (Not a starting point)
- [ ] Are all edge cases handled?
- [ ] Is the result production-ready?
- [ ] Have I verified correctness with actual tool output?
- [ ] Have I tested the result (build, typecheck, tests)?
- [ ] Are there any TODO/stub/placeholder artifacts left?
<!-- END:quality-standard -->

<!-- BEGIN:project-conventions -->
# SendQuote Project Conventions

## Build & Test
- `pnpm dev` — development server
- `pnpm build` — production build (Next.js 16.2 + Turbopack)
- `pnpm test` — Vitest unit tests (119 tests)
- `pnpm test:e2e` — Playwright E2E tests
- `pnpm typecheck` — `tsc --noEmit` (strict mode)
- `pnpm lint` — ESLint

## Code Style
- TypeScript strict mode, no `any`
- Prefer `function` declarations over arrow functions for components
- Import type `m` from `@/components/shared/motion-client` for motion animations
- Use `cn()` from `@/lib/utils` for className merging
- shadcn/ui v4 nova style — use `@/components/ui/*` primitives
- Icon library: `lucide-react` (NO emoji as icons)
- SVG icons only from Lucide or inline SVGs (no react-icons)

## Architecture
- App Router with Server Components by default, `"use client"` only when needed
- API routes: Zod schema → requireAuth → handler → Sentry on error
- Rate limiting: use shared `checkMemoryRateLimit` from `@/lib/rate-limit` (not private Maps)
- CRON secrets: use `verifyCronSecret` from `@/lib/security/cron`
- Env vars: validated at startup via `@/lib/config`
- Supabase: use `createServerClient()` (server), `createBrowserClient()` (client), `createAdminClient()` (service role — with comment explaining why)

## UI/UX Rules
- No emoji icons — use Lucide components
- `cursor-pointer` on all clickable elements
- `transition-colors duration-200` on interactive elements (not `transition-all`)
- `aria-label` on all icon-only buttons
- Minimum 4.5:1 color contrast (use `text-gray-400` not `text-white/40`)
- `prefers-reduced-motion` respected
- z-index via CSS variables (`--z-dropdown: 50`, etc.)
- Theme via CSS variables in `globals.css`

## CSS (Tailwind v4)
- No `tailwind.config.js` — CSS-first config via `@theme inline` in `globals.css`
- No `@layer base` — Tailwind v4 handles it
- Use `motion-safe:` prefix for CSS animations

## Database
- Supabase PostgreSQL with RLS on all tables
- Migrations in `supabase/migrations/`
- RPC functions for atomic operations (e.g., `increment_quote_counter`)
- `generateQuoteNumber()` uses atomic RPC, not read-then-write
<!-- END:project-conventions -->
