# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20250611-001] be-thorough-and-complete

**Logged**: 2025-06-11T00:00:00Z
**Priority**: critical
**Status**: promoted
**Area**: config

### Summary
User expects top-tier quality — complete, production-ready results matching what the most intelligent models deliver.

### Details
User gave direct feedback: I make too many mistakes, don't use my full potential, give incomplete results. They want results matching **Claude Fable 5 / Claude Mythos 5** — Anthropic's Mythos-class models (released June 9, 2026), the most capable models ever made generally available. $10/$50 per MTok, 1M context, 128K output, above Opus tier. User expects that level of quality from me. This means thinking deeper, being more thorough, and delivering fully complete work every time.

### Suggested Action
- Always complete the full task end-to-end, not just a starting point
- Use all available tools to their full extent (dispatch parallel subagents)
- Self-verify: audit claims against tool results before reporting
- First-shot correctness: understand scope fully before writing any code
- Kill incorrect beliefs immediately when discovered
- Record lessons for future reference
- Go the extra mile — implement fully, not minimally
- Never cut corners or leave work half-done
- If a task is complex, plan first then execute completely

### Metadata
- Source: user_feedback
- Related Files: AGENTS.md
- Tags: quality, thoroughness, completeness

---
