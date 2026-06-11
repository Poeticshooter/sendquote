-- Migration: create coupon_usages table
-- Created from production schema dump
-- This migration was reverse-engineered from production

BEGIN;

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    coupon_id uuid,
    user_id uuid,
    subscription_id uuid,
    discount_applied numeric NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Add primary key if table was pre-existing without one
ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_pkey
    PRIMARY KEY (id);

-- Step 3: Add foreign key constraints
ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_coupon_id_fkey
    FOREIGN KEY (coupon_id) REFERENCES public.coupons(id)
    ON DELETE CASCADE;

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_subscription_id_fkey
    FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user
    ON public.coupon_usages (coupon_id, user_id);

COMMIT;
