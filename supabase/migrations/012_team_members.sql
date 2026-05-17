-- Migration 012: Add team members table
-- Professional plan allows up to 5 team members per account.

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'removed')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invite_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_account ON team_members(account_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_token ON team_members(invite_token) WHERE invite_token IS NOT NULL;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Account owners can manage their team
DROP POLICY IF EXISTS "Account owners can manage team" ON team_members;
CREATE POLICY "Account owners can manage team" ON team_members FOR ALL
  USING (auth.uid() = account_user_id);

-- Team members can view their own membership
DROP POLICY IF EXISTS "Members can view own membership" ON team_members;
CREATE POLICY "Members can view own membership" ON team_members FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- AUTO UPDATE updated_at
-- ============================================
DROP TRIGGER IF EXISTS set_team_members_updated_at ON team_members;
CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CHECK TEAM MEMBER LIMIT
-- ============================================
CREATE OR REPLACE FUNCTION check_team_limit(p_account_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_member_count INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT plan INTO v_plan FROM profiles WHERE user_id = p_account_user_id;

  v_limit := CASE v_plan
    WHEN 'professional' THEN 5
    WHEN 'starter' THEN 1
    ELSE 0
  END;

  SELECT COUNT(*) INTO v_member_count
  FROM team_members
  WHERE account_user_id = p_account_user_id AND status != 'removed';

  RETURN jsonb_build_object(
    'allowed', v_member_count < v_limit,
    'current', v_member_count,
    'limit', v_limit,
    'plan', v_plan
  );
END;
$$;
