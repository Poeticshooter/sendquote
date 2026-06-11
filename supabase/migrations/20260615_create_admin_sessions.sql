-- Migration: create admin_sessions table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey
    PRIMARY KEY (id);

COMMIT;
