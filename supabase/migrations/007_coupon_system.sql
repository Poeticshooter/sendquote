-- Migration 007: Coupon System
-- Adds coupon management for admin to give free access to close clients

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all_plans' CHECK (applies_to IN ('all_plans', 'starter', 'professional', 'enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'both' CHECK (billing_cycle IN ('monthly', 'annual', 'both')),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  discount_applied NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add coupon_code to subscriptions for tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);

-- Row Level Security
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all coupons (using service role bypasses RLS)
-- Users can only see their own usage
DROP POLICY IF EXISTS coupon_usages_read_own ON coupon_usages;
CREATE POLICY coupon_usages_read_own ON coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

-- RPC: Validate coupon (returns discount info without applying)
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_plan TEXT, p_billing_cycle TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_result JSONB;
BEGIN
  -- Find active coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_code)
    AND active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;

  -- Check plan applicability
  IF v_coupon.applies_to != 'all_plans' AND v_coupon.applies_to != p_plan THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon does not apply to this plan');
  END IF;

  -- Check billing cycle
  IF v_coupon.billing_cycle != 'both' AND v_coupon.billing_cycle != p_billing_cycle THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon does not apply to this billing cycle');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'description', v_coupon.description
  );
END;
$$;

-- RPC: Apply coupon (increments usage count)
CREATE OR REPLACE FUNCTION apply_coupon(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE code = UPPER(p_code)
    AND active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);

  RETURN FOUND;
END;
$$;
