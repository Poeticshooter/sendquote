-- Add unique constraint on quotes.quote_number to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(quote_number);
