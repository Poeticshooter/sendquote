-- Migration: create analytics_events table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    event_type text NOT NULL,
    event_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraint
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_event_created
    ON public.analytics_events (user_id, event_type, created_at);

COMMIT;
