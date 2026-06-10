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
