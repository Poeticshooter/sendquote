-- Migration: Add missing status column to webhook_events
--
-- The process_razorpay_payment RPC references webhook_events.status
-- but the column was never added to the table. This fixes that.

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status text;

-- Backfill existing rows
UPDATE public.webhook_events SET status = 'processed' WHERE status IS NULL;
