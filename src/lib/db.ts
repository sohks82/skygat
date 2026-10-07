import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

let client: Sql | null = null;

function connect(): Sql {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Attach a database in Vercel, or fill in .env locally.");
  }

  client = postgres(url, {
    // One connection per serverless invocation. Scaling happens by the platform
    // starting more invocations, not by this pool growing.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // Transaction-mode poolers (Supabase Supavisor on 6543, Neon's -pooler
    // endpoint) cannot hold prepared statements across checkouts.
    prepare: false,
    // "already exists" notices from idempotent DDL are expected, not useful.
    onnotice: () => {},
    ssl: /sslmode=disable|localhost|127\.0\.0\.1/.test(url) ? false : "require",
  });

  return client;
}

/**
 * Tagged-template query helper, provider-agnostic: works against Neon,
 * Supabase, or any Postgres, so moving between them is a DATABASE_URL change
 * and nothing more. Connects on first use so the app can be built before a
 * database is attached.
 */
export const sql: Sql = new Proxy((() => {}) as never, {
  apply: (_t, _this, args: never[]) => (connect() as never as (...a: never[]) => unknown)(...args),
  get: (_t, prop) => {
    const value = (connect() as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(connect()) : value;
  },
});
