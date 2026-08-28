/**
 * Applies every .sql file in db/migrations, in filename order.
 *
 *   npm run db:migrate
 *
 * Migrations use "if not exists", so re-running is safe.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env next to package.json.');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "db", "migrations");
const sql = neon(process.env.DATABASE_URL);

const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
console.log(`Applying ${files.length} migration file(s)…\n`);

for (const file of files) {
  const statements = readFileSync(join(dir, file), "utf8")
    .replace(/^[ \t]*--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await sql(statement, []);
      console.log(`  ✓ ${statement.replace(/\s+/g, " ").slice(0, 64)}`);
    } catch (err) {
      console.error(`  ✗ ${file}\n\n    ${err.message}\n`);
      process.exit(1);
    }
  }
}

console.log("\nMigrations applied.");
