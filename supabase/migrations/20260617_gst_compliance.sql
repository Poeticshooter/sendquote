-- Migration: GST compliance — CGST/SGST/IGST split + HSN/SAC codes
-- Required for Indian GST invoice legal compliance

-- ============================================================
-- 1. Add HSN/SAC code to quote_items
-- ============================================================
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS hsn_code text;

ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS hsn_code text;

-- ============================================================
-- 2. Add CGST/SGST/IGST columns to quotes
-- ============================================================
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS cgst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS sgst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS igst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS igst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS place_of_supply text;

-- ============================================================
-- 3. Add CGST/SGST/IGST columns to invoices
-- ============================================================
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS cgst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS sgst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS igst_rate numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS igst_amount numeric DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS place_of_supply text;

-- ============================================================
-- 4. Add role column to profiles (replaces plan-based admin check)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' NOT NULL;

-- ============================================================
-- 5. Add leads.user_id column (missing RLS requirement)
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 6. Update RLS policy for leads (now that user_id exists)
-- ============================================================
DROP POLICY IF EXISTS "Users can read own leads" ON public.leads;
CREATE POLICY "Users can read own leads" ON public.leads
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Users can manage own leads" ON public.leads;
CREATE POLICY "Users can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 7. Update admin RLS to use role column instead of plan
-- ============================================================
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.admin_audit_log;
CREATE POLICY "Only admins can view audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can read admin sessions" ON public.admin_sessions;
CREATE POLICY "Only admins can read admin sessions" ON public.admin_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
