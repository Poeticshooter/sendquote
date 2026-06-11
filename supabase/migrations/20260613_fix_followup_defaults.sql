-- Fix default follow-up sequences: set sentinel UUID to NULL
-- Legacy data used '00000000-0000-0000-0000-000000000000' instead of NULL
-- New code matches both, but this normalizes the data

UPDATE public.followup_sequences
SET user_id = NULL
WHERE user_id = '00000000-0000-0000-0000-000000000000';
