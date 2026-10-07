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
import postgres from "postgres";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env next to package.json.');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "db", "migrations");
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {}, ssl: /sslmode=disable|localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : "require" });

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
      await sql.unsafe(statement);
      console.log(`  ✓ ${statement.replace(/\s+/g, " ").slice(0, 64)}`);
    } catch (err) {
      console.error(`  ✗ ${file}\n\n    ${err.message}\n`);
      await sql.end();
      process.exit(1);
    }
  }
}

console.log("\nMigrations applied.");

await sql.end();
