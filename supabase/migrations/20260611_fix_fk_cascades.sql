-- Add ON DELETE CASCADE to quote_items foreign key
ALTER TABLE public.quote_items
  DROP CONSTRAINT IF EXISTS quote_items_quote_id_fkey,
  ADD CONSTRAINT quote_items_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to invoice_items foreign key
ALTER TABLE public.invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey,
  ADD CONSTRAINT invoice_items_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to quote_events (missing FK altogether — this adds it)
ALTER TABLE public.quote_events
  DROP CONSTRAINT IF EXISTS quote_events_quote_id_fkey,
  ADD CONSTRAINT quote_events_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to quote_signatures
ALTER TABLE public.quote_signatures
  DROP CONSTRAINT IF EXISTS quote_signatures_quote_id_fkey,
  ADD CONSTRAINT quote_signatures_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to deal_room_messages
ALTER TABLE public.deal_room_messages
  DROP CONSTRAINT IF EXISTS deal_room_messages_quote_id_fkey,
  ADD CONSTRAINT deal_room_messages_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to approval_requests
ALTER TABLE public.approval_requests
  DROP CONSTRAINT IF EXISTS approval_requests_quote_id_fkey,
  ADD CONSTRAINT approval_requests_quote_id_fkey
    FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE;
