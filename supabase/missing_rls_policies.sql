-- Missing RLS policies for 6 tables with 0 policies

DO $$
DECLARE
  has_col boolean;
BEGIN
  -- 1. achievement_definitions: all authenticated users can read (reference data)
  has_col := EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'achievement_definitions');
  IF has_col THEN
    DROP POLICY IF EXISTS "Anyone can read achievements" ON public.achievement_definitions;
    EXECUTE 'CREATE POLICY "Anyone can read achievements" ON public.achievement_definitions FOR SELECT TO authenticated USING (true)';
  END IF;

  -- 2. coupons: authenticated users can read available coupons
  has_col := EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'coupons');
  IF has_col THEN
    DROP POLICY IF EXISTS "Users can view coupons" ON public.coupons;
    EXECUTE 'CREATE POLICY "Users can view coupons" ON public.coupons FOR SELECT TO authenticated USING (true)';
  END IF;

  -- 3. feature_flags: users can read enabled flags
  has_col := EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feature_flags');
  IF has_col THEN
    DROP POLICY IF EXISTS "Users can read feature flags" ON public.feature_flags;
    EXECUTE 'CREATE POLICY "Users can read feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (true)';
  END IF;

  -- 4. organization_members: users can read their own membership
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users can read own org membership" ON public.organization_members;
    EXECUTE 'CREATE POLICY "Users can read own org membership" ON public.organization_members FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;

  -- 5. organizations: users can read orgs they belong to
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    DROP POLICY IF EXISTS "Users can read own org" ON public.organizations;
    EXECUTE 'CREATE POLICY "Users can read own org" ON public.organizations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.organization_members WHERE organization_members.organization_id = id AND organization_members.user_id = auth.uid()))';
  END IF;

  -- 6. user_flag_overrides: users manage their own overrides
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_flag_overrides' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users manage own flag overrides" ON public.user_flag_overrides;
    EXECUTE 'CREATE POLICY "Users manage own flag overrides" ON public.user_flag_overrides USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- Verify
SELECT t.tablename, t.rowsecurity, count(p.policyname) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT IN ('_prisma_migrations', 'spatial_ref_sys')
GROUP BY t.tablename, t.rowsecurity
HAVING count(p.policyname) = 0
ORDER BY t.tablename;
