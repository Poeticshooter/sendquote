-- Migration 022: Add 'archived' and 'lost' to quotes.status CHECK constraint
-- Rationale: Code references these statuses (DashboardShell bulk actions, QuoteDetailClient,
-- public-quote route) but the CHECK constraint only allowed 6 values.

ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

ALTER TABLE quotes ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft', 'sent', 'opened', 'accepted', 'changes_requested', 'expired', 'archived', 'lost'));
