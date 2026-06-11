-- Migration: create webhooks table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.webhooks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    url text NOT NULL,
    events text[] NOT NULL,
    secret text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraint
ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_user_active
    ON public.webhooks (user_id, active);

COMMIT;
