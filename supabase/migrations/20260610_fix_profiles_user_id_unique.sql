-- Add unique constraint on profiles.user_id used by ON CONFLICT upsert
-- Safely handles case where constraint already exists (e.g., after fresh install)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
