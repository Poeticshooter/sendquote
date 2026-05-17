-- Migration 014: Add versioning columns to quotes
-- Supports quote duplication with parent/child relationship and version tracking.

-- ============================================
-- PART 1: Add parent_quote_id and version columns
-- ============================================
-- parent_quote_id: references the original quote when this is a duplicate/revision
-- version: auto-incremented version number (1 for originals)

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Existing quotes are originals (version 1, no parent)
-- No backfill needed — defaults handle this.

-- ============================================
-- PART 2: Index for version queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotes_parent ON quotes(parent_quote_id) WHERE parent_quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_version ON quotes(user_id, quote_number, version);
