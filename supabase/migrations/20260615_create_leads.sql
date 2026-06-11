-- Migration: create leads table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    source text DEFAULT 'landing_page'::text,
    status text DEFAULT 'new'::text,
    referred_by text,
    notes text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey
    PRIMARY KEY (id);

-- Step 3: Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email
    ON public.leads (email);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_status_created
    ON public.leads (status, created_at);

COMMIT;
