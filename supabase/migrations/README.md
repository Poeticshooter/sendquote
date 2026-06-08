# Database Migrations

## Current State

Only 1 migration file exists (`20260608_gamification_features.sql`). The core application tables (quotes, profiles, clients, invoices, subscriptions, etc.) were created outside the migration system and exist only in the live Supabase project.

## Recovery Procedure

If the database needs to be recreated from scratch:

1. Install Supabase CLI: `npm install -g supabase`
2. Link to project: `supabase link --project-ref yabsujbilznpoayueokq`
3. Dump current schema: `supabase db dump -f supabase/migrations/20260601_initial_schema.sql`
4. Dump seed data: `supabase db dump --data-only -f supabase/seed.sql`

## Verify RLS

Run this in Supabase SQL Editor to check all tables have RLS:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT IN ('_prisma_migrations')
ORDER BY tablename;
```

Any table with `rowsecurity = false` needs RLS enabled.
