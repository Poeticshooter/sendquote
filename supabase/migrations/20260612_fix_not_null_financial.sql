-- Ensure critical financial columns are NOT NULL
ALTER TABLE public.quotes ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE public.quotes ALTER COLUMN total SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN balance_due SET NOT NULL;
