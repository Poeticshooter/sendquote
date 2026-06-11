-- Migration: create feedback table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.feedback (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    message text NOT NULL,
    rating integer,
    category text NOT NULL,
    page text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraint
ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_category
    ON public.feedback (user_id, category);

COMMIT;
