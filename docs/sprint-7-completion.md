# Sprint 7 Completion Report — Dark Mode Removal

**Date:** 2026-05-17
**Status:** Complete

## Summary

Dark mode has been completely removed from SendQuote. The app is now light-theme only for MVP. This simplifies the codebase, eliminates inconsistent theme behavior, and makes the app easier to reason about.

## Changes Made

### 1. Dark Mode Infrastructure Removed

- **`src/app/layout.tsx`**: Removed inline script that set `dark` class on `<html>` based on localStorage/prefers-color-scheme. Removed `dark:` variants from body className.
- **`src/app/globals.css`**:
  - Removed `.dark { ... }` CSS variables block (13 lines)
  - Removed `.dark .skeleton { ... }` rule
  - Removed `.dark ::-webkit-scrollbar-thumb` rules
  - Added `html { color-scheme: light; }` to prevent browsers from auto-darkening
- **`src/components/theme-toggle.tsx`**: Replaced toggle button with static sun icon indicator (no interaction, no state, no localStorage)

### 2. Dark: Classes Removed from All Components

Removed `dark:` Tailwind variants from 17 files:

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Body className cleaned |
| `src/app/page.tsx` | Landing page cleaned |
| `src/app/login/LoginClient.tsx` | Login form cleaned |
| `src/app/register/RegisterClient.tsx` | Registration form cleaned |
| `src/app/dashboard/DashboardShell.tsx` | Dashboard, sidebar, header, modals cleaned |
| `src/app/dashboard/QuoteTable.tsx` | Table rows and headers cleaned |
| `src/app/settings/SettingsClient.tsx` | Settings page cleaned |
| `src/app/upgrade/UpgradeClient.tsx` | Upgrade page cleaned |
| `src/app/quote/[id]/QuoteDetailClient.tsx` | Quote detail page cleaned |
| `src/components/theme-toggle.tsx` | Rewritten as static indicator |
| `src/components/voice-assistant.tsx` | Voice assistant UI cleaned |
| `src/components/landing/hero-section.tsx` | Hero section cleaned |
| `src/components/landing/how-it-works.tsx` | Steps section cleaned |
| `src/components/landing/sections.tsx` | Features, testimonials, FAQ, pricing, footer cleaned |
| `src/components/landing/animations.tsx` | Animation components cleaned |
| `src/lib/status-styles.ts` | Status badge styles cleaned |

### 3. Remaining Dark References (Intentionally Kept)

- `src/lib/pdf.ts:350` — QR code library config (`color: { dark: '#000000', light: '#FFFFFF' }`). This is a QR code generation parameter, not Tailwind dark mode.
- `src/app/globals.css` — CSS variables `--primary-dark` and `--color-primary-dark`. These are color shade names, not dark mode references.

### 4. UI Changes

- Theme toggle in header is now a static sun icon (no click handler, no state)
- No text or badges claim dark mode support
- All components render consistently in light theme

## Verification

### Lint
- 4 pre-existing lint errors in untracked files (AnalyticsClient, EmailTemplatesClient, VoiceSettingsClient, feedback-modal)
- **0 new lint errors introduced**

### TypeScript
- 284 pre-existing TS errors in untracked files
- **0 new TS errors introduced**

### Tests
- **292/292 tests passing** across 31 test files
- No test changes required (no tests specifically asserted dark mode behavior)

## Documentation Updates

- `PROJECT_DOCUMENTATION.md`: Updated ThemeToggle description from "Light/dark mode" to "Light theme indicator"

## Deferred to Future

- Dark mode support is deferred to post-MVP. When re-implemented, it should be done systematically with:
  - Proper CSS variable theming
  - Consistent `dark:` variants across all components
  - Testing in both themes

## Files Modified

16 files modified, 1 file rewritten:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/login/LoginClient.tsx`
- `src/app/register/RegisterClient.tsx`
- `src/app/dashboard/DashboardShell.tsx`
- `src/app/dashboard/QuoteTable.tsx`
- `src/app/settings/SettingsClient.tsx`
- `src/app/upgrade/UpgradeClient.tsx`
- `src/app/quote/[id]/QuoteDetailClient.tsx`
- `src/components/theme-toggle.tsx` (rewritten)
- `src/components/voice-assistant.tsx`
- `src/components/landing/hero-section.tsx`
- `src/components/landing/how-it-works.tsx`
- `src/components/landing/sections.tsx`
- `src/components/landing/animations.tsx`
- `src/lib/status-styles.ts`
- `PROJECT_DOCUMENTATION.md`
