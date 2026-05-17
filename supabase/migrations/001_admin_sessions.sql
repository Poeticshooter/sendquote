-- Admin Sessions Table
-- Stores server-side admin session tokens for secure authentication

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Clean up expired sessions periodically
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$;
