import "server-only";
import { Pool, type PoolClient } from "pg";

// One connection pool per server process. In dev, hot reloads re-run this module,
// so keep the pool on globalThis to avoid opening a new pool on every edit.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (see README).");
  }
  return new Pool({ connectionString, max: 10 });
}

export function getPool(): Pool {
  globalForDb.pgPool ??= createPool();
  return globalForDb.pgPool;
}

// Runs fn inside BEGIN/COMMIT on one connection; rolls back if fn throws.
export async function withTransaction<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await getPool().connect();
  try {
    await db.query("BEGIN");
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    db.release();
  }
}

export type { PoolClient };

export function query<T extends object = Record<string, unknown>>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params);
}
