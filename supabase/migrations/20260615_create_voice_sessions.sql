-- Migration: create voice_sessions table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    messages jsonb NOT NULL DEFAULT '[]'::jsonb,
    context jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT voice_sessions_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraint
ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT voice_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_created
    ON public.voice_sessions (user_id, created_at);

COMMIT;
