-- Ensure approval_rules has default for active column
ALTER TABLE public.approval_rules ALTER COLUMN active SET DEFAULT true;
-- Also ensure existing rows get active = true if null
UPDATE public.approval_rules SET active = true WHERE active IS NULL;
