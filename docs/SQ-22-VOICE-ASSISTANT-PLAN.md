# SQ-22: Unified Voice/Chat Assistant — Implementation Plan

**Priority:** P1 (Key USP / Differentiator)
**Status:** Parts B, C, E (MVP) COMPLETE. Parts A, D deferred.
**Constraint:** No new paid APIs or heavy dependencies

> **Beta Gating:** Assistant is currently beta-gated behind `profiles.beta_voice_assistant`. Default: off. Coming soon for general users. Toggle in Settings → Voice Assistant → "Enable Assistant Beta".

---

## Completed (Sprint 5)

### Part B: Persistent Chat Memory ✅
- Created `voice_sessions` table (migration 027)
- Sessions persist across browser restarts (24h timeout)
- Auto-save with 1s debounce
- `/settings/voice` page for viewing/clearing history
- Functions: `loadVoiceSession`, `saveVoiceSession`, `clearVoiceSession`, `getVoiceSessionHistory`

### Part C: Proactive Smart Follow-Ups ✅
- Created `voice-proactive.ts` with intelligent suggestions
- Detects: unopened quotes, expiring quotes, drafts, recently accepted quotes
- Shows proactive cards in voice assistant on open
- Quick-action buttons for each suggestion
- Dismissible, max 3 suggestions sorted by priority

### Part E (MVP): Enhanced Voice Input on QuoteWizard ✅
- Created `voice-wizard-commands.ts` with multi-field parsing
- Commands: add_item, set_client, set_email, set_gst, set_discount, navigate, save_draft, save_and_send, cancel, help
- Step-aware hints for each wizard step
- Voice buttons on all 4 wizard steps
- Parses natural language: "cement 50 bags at 350" → fills description, quantity, rate
- Navigation: "next", "back", "step 3"
- Tests: 22 unit tests for command parsing

---

## Deferred (Not Implemented)

### Part A: AI-Powered Intent Understanding
- **Status:** Deferred — requires external NLU layer
- **Reason:** Keep rule-based engine for now; no paid APIs
- **Future:** WebLLM or free-tier LLM for paraphrase handling

### Part D: Client-Facing Voice Widget
- **Status:** Deferred — requires public page integration
- **Reason:** Complex auth-free interaction with rate limiting
- **Future:** Add to `/quote/[id]/public` page

---

## Files Created/Modified

### New Files
- `supabase/migrations/027_voice_sessions.sql`
- `src/lib/voice-session.ts`
- `src/lib/voice-session.test.ts`
- `src/lib/voice-proactive.ts`
- `src/lib/voice-wizard-commands.ts`
- `src/lib/voice-wizard-commands.test.ts`
- `src/app/settings/voice/page.tsx`
- `src/app/settings/voice/VoiceSettingsClient.tsx`

### Modified Files
- `src/components/voice-assistant.tsx` — Session persistence + proactive suggestions
- `src/components/voice-input-button.tsx` — Multi-field parsing + step-aware hints
- `src/components/quote-wizard.tsx` — Voice command integration on all steps

---

## Test Results
- **Test Files:** 31 passed
- **Tests:** 301 passed, 0 failed
- **Coverage:** 24.88% statements (265/1065)

---

## Next Steps (Remaining TODOs)
1. Proration logic for mid-cycle plan changes
2. Analytics dashboard from `analytics_events`
3. Email template customization UI
4. Quote versioning diff UI
5. Health check with DB verification
6. Coverage threshold in vitest config
