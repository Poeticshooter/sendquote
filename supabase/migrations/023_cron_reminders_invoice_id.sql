-- Migration 023: Add invoice_id to cron_reminders for proper FK separation
-- Rationale: Invoice overdue reminders were storing invoice UUIDs in quote_id,
-- which violates the FK to quotes(id) in migration 021.

-- Step 1: Drop the existing FK constraint on quote_id (if it exists)
ALTER TABLE cron_reminders DROP CONSTRAINT IF EXISTS cron_reminders_quote_id_fkey;

-- Step 2: Make quote_id nullable
ALTER TABLE cron_reminders ALTER COLUMN quote_id DROP NOT NULL;

-- Step 3: Add invoice_id column
ALTER TABLE cron_reminders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;

-- Step 4: Add CHECK that at least one of quote_id or invoice_id is non-null
ALTER TABLE cron_reminders ADD CONSTRAINT cron_reminders_entity_check
  CHECK (quote_id IS NOT NULL OR invoice_id IS NOT NULL);

-- Step 5: Re-add FK on quote_id (now nullable)
ALTER TABLE cron_reminders ADD CONSTRAINT cron_reminders_quote_id_fkey
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

-- Step 6: Update unique constraint to cover both entity types
-- Drop old unique constraint if it exists
ALTER TABLE cron_reminders DROP CONSTRAINT IF EXISTS unique_quote_reminder;
ALTER TABLE cron_reminders DROP CONSTRAINT IF EXISTS cron_reminders_quote_id_reminder_type_key;

-- Create new unique indexes for each entity type
CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_reminders_quote_unique
  ON cron_reminders(quote_id, reminder_type) WHERE quote_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cron_reminders_invoice_unique
  ON cron_reminders(invoice_id, reminder_type) WHERE invoice_id IS NOT NULL;

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_cron_reminders_invoice ON cron_reminders(invoice_id) WHERE invoice_id IS NOT NULL;
