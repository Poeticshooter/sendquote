-- Migration: create payments table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text DEFAULT 'bank_transfer'::text,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    organization_id uuid
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraints
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
    ON DELETE CASCADE;

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE SET NULL;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_created
    ON public.payments (invoice_id, created_at);

COMMIT;
