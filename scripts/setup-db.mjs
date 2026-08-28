/**
 * Creates the tables in your Neon database.
 *
 *   npm run db:setup
 *
 * Safe to re-run — every statement in schema.sql uses "if not exists".
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set.\n\n" +
      "Create a .env file next to package.json containing:\n" +
      '  DATABASE_URL="postgresql://...your Neon connection string..."\n',
  );
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);
const raw = readFileSync(join(here, "..", "db", "schema.sql"), "utf8");

// Strip whole-line comments first. Without this, a comment sitting above a
// statement gets glued to it and the statement can be skipped. Trailing inline
// comments are left alone — Postgres parses those fine.
const statements = raw
  .replace(/^[ \t]*--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Applying ${statements.length} statements to Neon…\n`);

let applied = 0;
for (const statement of statements) {
  const label = statement.replace(/\s+/g, " ").slice(0, 64);
  try {
    // The HTTP driver has no .query() — call it directly with a text + params pair.
    await sql(statement, []);
    console.log(`  ✓ ${label}`);
    applied++;
  } catch (err) {
    console.error(`  ✗ ${label}\n\n    ${err.message}\n`);
    process.exit(1);
  }
}

console.log(`\nSchema applied — ${applied} statements. Next: npm run db:import`);
