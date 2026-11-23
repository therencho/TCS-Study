/**
 * Applies db/schema.sql to Neon. Runs before every build; does nothing without DATABASE_URL.
 * Every statement is idempotent (IF NOT EXISTS / OR REPLACE).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("• DATABASE_URL not set: skipping database migration (app runs local-only).");
  process.exit(0);
}

const sql = neon(url);
const statements = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8")
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  for (const s of statements) await sql.query(s);
  console.log(`✓ Database schema up to date (${statements.length} statements).`);
})().catch((e) => {
  console.error("✗ Database migration failed:", e);
  process.exit(1);
});
