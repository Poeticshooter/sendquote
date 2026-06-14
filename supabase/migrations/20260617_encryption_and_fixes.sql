-- Migration: Encrypt existing SMTP passwords + fix remaining issues

-- ============================================================
-- 1. Encrypt existing SMTP passwords
-- The smtp_app_password column will now store encrypted values
-- Encryption is done server-side in the application layer
-- ============================================================

-- ============================================================
-- 2. Add quote_events trigger for manual status changes
-- ============================================================
-- This is handled in application code in updateQuoteStatus()
-- But also add a DB-level trigger for direct updates
CREATE OR REPLACE FUNCTION public.log_quote_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.quote_events (quote_id, event_type, notes, metadata)
    VALUES (
      NEW.id,
      'status:' || NEW.status,
      'Status changed from "' || OLD.status || '" to "' || NEW.status || '"',
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_status_change ON public.quotes;
CREATE TRIGGER trg_quote_status_change
  AFTER UPDATE OF status ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_quote_status_change();

-- ============================================================
-- 3. Update accept_quote RPC to return GST split fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_quote(
  p_public_token TEXT,
  p_signatory_name TEXT,
  p_signatory_email TEXT,
  p_signature_data TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote RECORD;
  v_invoice_number TEXT;
  v_result JSONB;
BEGIN
  SELECT id, user_id, client_name, client_email, status,
         subtotal, gst_rate, gst_amount, total,
         cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount,
         organization_id, quote_number
  INTO v_quote
  FROM public.quotes
  WHERE public_token = p_public_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Quote not found');
  END IF;

  IF v_quote.status = 'accepted' THEN
    RETURN jsonb_build_object('status', 'duplicate', 'message', 'Quote already accepted');
  END IF;

  IF v_quote.status != 'sent' THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Quote must be in "sent" status to accept');
  END IF;

  INSERT INTO public.quote_signatures (quote_id, signatory_name, signatory_email, signature_data)
  VALUES (v_quote.id, p_signatory_name, p_signatory_email, p_signature_data);

  v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY-MM') || '-' || UPPER(SUBSTR(MD5(NOW()::TEXT), 1, 8));

  INSERT INTO public.invoices (
    user_id, quote_id, invoice_number, client_name, client_email,
    amount, subtotal, gst_rate, gst_amount,
    cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount,
    paid_amount, balance_due, status,
    organization_id
  ) VALUES (
    v_quote.user_id, v_quote.id, v_invoice_number, v_quote.client_name, v_quote.client_email,
    v_quote.total, v_quote.subtotal, v_quote.gst_rate, v_quote.gst_amount,
    COALESCE(v_quote.cgst_rate, 0), COALESCE(v_quote.cgst_amount, 0),
    COALESCE(v_quote.sgst_rate, 0), COALESCE(v_quote.sgst_amount, 0),
    COALESCE(v_quote.igst_rate, 0), COALESCE(v_quote.igst_amount, 0),
    0, v_quote.total, 'pending',
    v_quote.organization_id
  );

  UPDATE public.quotes
  SET status = 'accepted', updated_at = now()
  WHERE id = v_quote.id AND status = 'sent';

  INSERT INTO public.quote_events (quote_id, event_type, metadata)
  VALUES (v_quote.id, 'accepted', jsonb_build_object(
    'signatory_name', p_signatory_name,
    'invoice_number', v_invoice_number
  ));

  RETURN jsonb_build_object(
    'status', 'accepted',
    'invoice_number', v_invoice_number,
    'quote_id', v_quote.id
  );
END;
$$;
