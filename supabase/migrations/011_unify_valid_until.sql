-- Migration 011: Unify valid_until and valid_till columns
-- The quotes table has both valid_until (TIMESTAMPTZ) and valid_till (DATE).
-- This migration consolidates to valid_until (TIMESTAMPTZ) as the single source of truth.

-- ============================================
-- Step 1: Copy valid_till data into valid_until where valid_until is NULL
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'valid_till') THEN
    UPDATE quotes
    SET valid_until = valid_till
    WHERE valid_till IS NOT NULL AND valid_until IS NULL;
  END IF;
END $$;

-- ============================================
-- Step 2: Drop the redundant valid_till column
-- ============================================
ALTER TABLE quotes DROP COLUMN IF EXISTS valid_till;

-- ============================================
-- Step 3: Add index on valid_until for expiry queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until) WHERE valid_until IS NOT NULL;
