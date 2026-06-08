-- Migration: Fixes for race conditions and constraints

-- 1. Add unique constraint on referrals (M3)
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referrer_email 
  ON referrals(referrer_id, referred_email);

-- 2. Create RPC for atomic quote counter increment (H6)
CREATE OR REPLACE FUNCTION increment_quote_counter(user_id UUID)
RETURNS TABLE (quote_counter BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  UPDATE profiles
  SET quote_counter = COALESCE(quote_counter, 0) + 1
  WHERE user_id = $1
  RETURNING quote_counter INTO next_val;
  
  -- Handle case where profile doesn't exist yet
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, quote_counter)
    VALUES ($1, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET quote_counter = profiles.quote_counter + 1
    RETURNING quote_counter INTO next_val;
  END IF;
  
  RETURN QUERY SELECT next_val;
END;
$$;
