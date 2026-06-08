-- Migration: AI response cache for cost optimization
-- Created: 2026-06-08
-- 
-- This table stores cached AI responses keyed by prompt+system hash.
-- Used by src/lib/ai/cache.ts to reduce redundant AI API calls.

CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT NOT NULL,
  system_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'groq',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash_lookup
  ON public.ai_cache (prompt_hash, system_hash, created_at DESC);

-- Auto-cleanup old entries (keeps table small)
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at
  ON public.ai_cache (created_at);
