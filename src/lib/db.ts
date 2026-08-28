import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

function connect(): NeonQueryFunction<false, false> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Attach a Neon database in Vercel, or fill in .env locally.");
  }
  client = neon(url);
  return client;
}

/**
 * Tagged-template query helper. Connects on first use rather than at import
 * time, so the app can be built before the database is attached.
 */
export const sql: NeonQueryFunction<false, false> = new Proxy((() => {}) as never, {
  apply: (_t, _this, args: never[]) => (connect() as never as (...a: never[]) => unknown)(...args),
  get: (_t, prop) => (connect() as unknown as Record<string | symbol, unknown>)[prop],
});
