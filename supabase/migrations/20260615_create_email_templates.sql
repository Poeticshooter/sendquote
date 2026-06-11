-- Migration: create email_templates table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    template_key text NOT NULL,
    subject text NOT NULL DEFAULT ''::text,
    body_html text NOT NULL DEFAULT ''::text,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraint
ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;

-- Step 4: Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_user_template
    ON public.email_templates (user_id, template_key);

COMMIT;
