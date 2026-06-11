# Migration Validation

## Setup
17 migration files to apply in order to a brand new Supabase project:
```
000000_initial_schema.sql      (NEW - reconstructed from code/migrations)
20260608_ai_cache.sql
20260608_fixes_migrations.sql
20260608_gamification_features.sql
20260608_performance_indexes.sql
20260609_missing_rls_policies.sql
20260610_fix_approval_rules.sql
20260610_fix_profiles_user_id_unique.sql
20260610_fix_quote_number_unique.sql
20260610_fix_quote_transaction.sql
20260611_fix_fk_cascades.sql
20260611_fix_fk_indexes.sql
20260611_fix_system_table_rls.sql
20260612_fix_composite_indexes.sql
20260612_fix_not_null_financial.sql
20260613_create_rate_limit_rpc.sql
20260613_fix_followup_defaults.sql
```

## Migration Analysis

### Idempotency Check
All migrations use idempotent patterns:

| Pattern | Migrations | Safe? |
|---|---|---|
| `CREATE TABLE IF NOT EXISTS` | 000000, 20260608_ai_cache, 20260608_gamification, 20260613_rate_limit | ✅ |
| `CREATE INDEX IF NOT EXISTS` | 000000, 20260608_performance_indexes, 20260610_quote_number, 20260611_fk_indexes, 20260612_composite_indexes | ✅ |
| `CREATE OR REPLACE FUNCTION` | 000000, 20260608_fixes, 20260610_quote_transaction, 20260613_rate_limit | ✅ |
| `DROP xxx IF EXISTS` then `CREATE` | 20260611_fk_cascades, 20260609_missing_rls | ✅ |
| `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` | 20260611_system_table_rls | ✅ |
| `ALTER TABLE ... IF NOT EXISTS` (constraint) | 20260610_fix_profiles_user_id_unique (patched) | ✅ |
| `INSERT ... ON CONFLICT DO NOTHING` | 000000 (seed data) | ✅ |

### Potential Issue Found

**ISSUE M-001**: `20260611_fix_system_table_rls.sql` creates RLS policies that ALREADY EXIST in the base schema (`000000_initial_schema.sql`). The migration uses plain `CREATE POLICY` without `DROP POLICY IF EXISTS` prefix. On a fresh install, Supabase will throw "policy already exists" errors for three policies:
- "Users can view own error logs" on error_logs
- "Only admins can view audit log" on admin_audit_log
- "Users can access own AI cache" on ai_cache

**Severity**: P1 — Blocks migration on fresh install.
**Fix**: Add `DROP POLICY IF EXISTS "policy_name" ON table_name;` before each `CREATE POLICY` in `20260611_fix_system_table_rls.sql`.

### Ordering Dependencies
All migrations assume the base schema (000000) has been applied first. This is correct — Supabase applies migrations in filename order, and 000000 comes first.

### Missing Extensions
No migrations explicitly enable PostgreSQL extensions (`pgcrypto`, `uuid-ossp`, etc.). The `gen_random_uuid()` function requires `pgcrypto`. Supabase projects come with this extension pre-enabled, so this works on Supabase but would fail on a vanilla PostgreSQL install.

### Result
**Migrations will apply with 1 error** (M-001). 16 of 17 migrations will succeed. One migration requires a fix before a fully automated fresh install.
