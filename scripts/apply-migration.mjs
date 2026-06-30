/* eslint-disable no-console */
/**
 * Apply RLS migration to Supabase
 * Run: node scripts/apply-migration.mjs
 */

import pg from "pg";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SSL_CERT = process.env.SUPABASE_SSL_CERT || "";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL environment variable is required");
  console.error("Usage: DATABASE_URL=\"postgresql://...\" node scripts/apply-migration.mjs");
  process.exit(1);
}

async function main() {
  const migrationFile = resolve(__dirname, "../supabase/migrations/20260615_enable_rls_on_all_tables.sql");
  const sql = readFileSync(migrationFile, "utf8");

  console.log(`Applying migration: ${migrationFile}`);
  console.log(`SQL size: ${sql.length} characters`);

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      ca: SSL_CERT || undefined,
    },
  });

  try {
    await client.connect();
    console.log("Connected to Supabase database");

    // Split by semicolons carefully
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let success = 0;
    let failed = 0;

    for (const stmt of statements) {
      try {
        // Skip DROP POLICY IF EXISTS if the policy doesn't exist yet
        await client.query(stmt + ";");
        success++;
      } catch (err) {
        const msg = err.message;
        // Ignore "policy does not exist" and "already exists" errors
        if (
          msg.includes("policy") ||
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("not exist")
        ) {
          console.warn(`⚠️  Skipped (expected): ${stmt.slice(0, 60)}...`);
          success++;
        } else {
          console.error(`❌ Failed: ${stmt.slice(0, 80)}...`);
          console.error(`   Error: ${msg}`);
          failed++;
        }
      }
    }

    console.log(`\n✅ Migration complete! ${success} statements executed, ${failed} failed`);

    // Verify RLS is enabled
    const { rows } = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    const protectedCount = rows.filter((r) => r.rowsecurity).length;
    const totalCount = rows.length;
    console.log(`\nRLS Status: ${protectedCount}/${totalCount} tables protected`);
    
    if (protectedCount === totalCount) {
      console.log("✅ All tables have RLS enabled!");
    } else {
      const unprotected = rows.filter((r) => !r.rowsecurity).map((r) => r.tablename);
      console.log(`⚠️  Unprotected tables: ${unprotected.join(", ")}`);
    }

  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Connection closed");
  }
}

main();
