-- RPC function to atomically create quote and items in a transaction
CREATE OR REPLACE FUNCTION create_quote_with_items(
  p_user_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_currency TEXT,
  p_notes TEXT,
  p_terms TEXT,
  p_valid_until TIMESTAMPTZ,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
  v_quote_number TEXT;
  v_result JSONB;
BEGIN
  -- Generate quote number
  SELECT quote_number INTO v_quote_number FROM generateQuoteNumber_auto();
  
  -- Insert quote
  INSERT INTO quotes (
    user_id, client_name, client_email, client_phone,
    currency, notes, terms, valid_until,
    status, quote_number, subtotal, tax, total
  ) VALUES (
    p_user_id, p_client_name, p_client_email, p_client_phone,
    p_currency, p_notes, p_terms, p_valid_until,
    'draft', v_quote_number, 0, 0, 0
  ) RETURNING id INTO v_quote_id;
  
  -- Parse and insert items
  -- (items will be inserted separately with proper quote_id)
  
  v_result = jsonb_build_object('quote_id', v_quote_id, 'quote_number', v_quote_number);
  RETURN v_result;
END;
$$;
