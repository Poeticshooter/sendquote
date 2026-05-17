-- Migration 009: Unify quote items data model
-- Make quote_items table the source of truth; update RPC to populate both

-- ============================================
-- UPDATE create_quote_with_items to also populate quote_items table
-- ============================================
CREATE OR REPLACE FUNCTION create_quote_with_items(
  p_user_id UUID,
  p_quote_number TEXT,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_items JSONB,
  p_subtotal DECIMAL,
  p_tax DECIMAL,
  p_discount DECIMAL,
  p_total DECIMAL,
  p_notes TEXT,
  p_terms TEXT,
  p_valid_until TIMESTAMPTZ,
  p_public_token TEXT
) RETURNS UUID AS $$
DECLARE
  v_quote_id UUID;
  v_item JSONB;
  v_sort_order INTEGER := 0;
BEGIN
  INSERT INTO quotes (
    user_id, quote_number, client_name, client_email, client_phone,
    items, subtotal, tax, discount, total, notes, terms, valid_until, public_token
  ) VALUES (
    p_user_id, p_quote_number, p_client_name, p_client_email, p_client_phone,
    p_items, p_subtotal, p_tax, p_discount, p_total, p_notes, p_terms, p_valid_until, p_public_token
  ) RETURNING id INTO v_quote_id;

  -- Also populate the quote_items table for consistency
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO quote_items (
      quote_id, description, quantity, unit, rate, amount, sort_order
    ) VALUES (
      v_quote_id,
      COALESCE(v_item->>'description', ''),
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      COALESCE(v_item->>'unit', 'nos'),
      COALESCE((v_item->>'rate')::DECIMAL, 0),
      COALESCE((v_item->>'amount')::DECIMAL, 0),
      v_sort_order
    );
    v_sort_order := v_sort_order + 1;
  END LOOP;

  RETURN v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Sync existing data: populate quote_items from JSONB where missing
-- ============================================
DO $$
DECLARE
  q RECORD;
  v_item JSONB;
  v_sort_order INTEGER;
BEGIN
  FOR q IN
    SELECT id, items
    FROM quotes
    WHERE jsonb_typeof(items) = 'array'
      AND jsonb_array_length(items) > 0
      AND NOT EXISTS (
        SELECT 1 FROM quote_items WHERE quote_items.quote_id = quotes.id
      )
  LOOP
    v_sort_order := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(q.items)
    LOOP
      INSERT INTO quote_items (
        quote_id, description, quantity, unit, rate, amount, sort_order
      ) VALUES (
        q.id,
        COALESCE(v_item->>'description', ''),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE(v_item->>'unit', 'nos'),
        COALESCE((v_item->>'rate')::DECIMAL, 0),
        COALESCE((v_item->>'amount')::DECIMAL, 0),
        v_sort_order
      );
      v_sort_order := v_sort_order + 1;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Add trigger to keep quote_items in sync when quotes.items is updated directly
-- ============================================
CREATE OR REPLACE FUNCTION sync_quote_items_from_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_sort_order INTEGER;
BEGIN
  -- Only sync if items changed and is a valid array
  IF TG_OP = 'UPDATE' AND (OLD.items IS DISTINCT FROM NEW.items) AND jsonb_typeof(NEW.items) = 'array' THEN
    -- Delete existing items
    DELETE FROM quote_items WHERE quote_id = NEW.id;

    -- Insert new items
    v_sort_order := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      INSERT INTO quote_items (
        quote_id, description, quantity, unit, rate, amount, sort_order
      ) VALUES (
        NEW.id,
        COALESCE(v_item->>'description', ''),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE(v_item->>'unit', 'nos'),
        COALESCE((v_item->>'rate')::DECIMAL, 0),
        COALESCE((v_item->>'amount')::DECIMAL, 0),
        v_sort_order
      );
      v_sort_order := v_sort_order + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_quote_items_trigger ON quotes;
CREATE TRIGGER sync_quote_items_trigger
  AFTER INSERT OR UPDATE OF items ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_items_from_jsonb();
