-- Add unique constraint on profiles.user_id used by ON CONFLICT upsert
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
