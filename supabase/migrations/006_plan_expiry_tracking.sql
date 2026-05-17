-- Plan Expiry Tracking
-- Adds plan_expires_at column (alias for plan_expiry) and index for efficient expiry queries

-- Note: profiles table already has plan_expiry column from migration 000.
-- This migration adds plan_expires_at as a generated alias for backward compatibility.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Sync plan_expires_at from plan_expiry for existing rows
UPDATE profiles SET plan_expires_at = plan_expiry WHERE plan_expires_at IS NULL AND plan_expiry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires ON profiles(plan_expires_at)
  WHERE plan_expires_at IS NOT NULL AND plan != 'free';

-- Function to downgrade expired plans (uses plan_expiry as the source of truth)
CREATE OR REPLACE FUNCTION downgrade_expired_plans()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE profiles
  SET plan = 'free', plan_expiry = NULL, plan_expires_at = NULL, billing_cycle = 'monthly'
  WHERE plan != 'free'
    AND plan_expiry IS NOT NULL
    AND plan_expiry < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
