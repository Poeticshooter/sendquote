-- Migration 010: Add dedicated clients table
-- Previously clients were derived from quotes.client_name, which prevented
-- independent client management, history, and deduplication.

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  notes TEXT,
  total_quotes INTEGER NOT NULL DEFAULT 0,
  total_invoices INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_quote_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_name ON clients(user_id, name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own clients" ON clients;
CREATE POLICY "Users can CRUD own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- AUTO UPDATE updated_at
-- ============================================
DROP TRIGGER IF EXISTS set_clients_updated_at ON clients;
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO CREATE CLIENT FROM QUOTE (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_client_from_quote()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update client when a quote is created/updated
  IF NEW.client_name IS NOT NULL AND NEW.client_name != '' THEN
    INSERT INTO clients (user_id, name, email, phone, client_address, last_quote_date, total_quotes)
    VALUES (
      NEW.user_id,
      NEW.client_name,
      NEW.client_email,
      NEW.client_phone,
      NEW.client_address,
      NEW.created_at,
      1
    )
    ON CONFLICT (user_id, name) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, clients.email),
      phone = COALESCE(EXCLUDED.phone, clients.phone),
      address = COALESCE(EXCLUDED.address, clients.address),
      last_quote_date = GREATEST(clients.last_quote_date, EXCLUDED.last_quote_date),
      total_quotes = clients.total_quotes + 1,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_client_on_quote ON quotes;
CREATE TRIGGER auto_create_client_on_quote
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION upsert_client_from_quote();

-- ============================================
-- BACKFILL: Create clients from existing quotes
-- ============================================
INSERT INTO clients (user_id, name, email, phone, address, last_quote_date, total_quotes)
SELECT DISTINCT ON (q.user_id, q.client_name)
  q.user_id,
  q.client_name,
  q.client_email,
  q.client_phone,
  q.client_address,
  q.created_at,
  (SELECT COUNT(*) FROM quotes q2 WHERE q2.user_id = q.user_id AND q2.client_name = q.client_name)
FROM quotes q
WHERE q.client_name IS NOT NULL
  AND q.client_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM clients c WHERE c.user_id = q.user_id AND c.name = q.client_name
  )
ON CONFLICT (user_id, name) DO UPDATE SET
  email = COALESCE(EXCLUDED.email, clients.email),
  phone = COALESCE(EXCLUDED.phone, clients.phone),
  address = COALESCE(EXCLUDED.address, clients.address),
  total_quotes = EXCLUDED.total_quotes,
  updated_at = NOW();
