import { Pool, type PoolClient } from "pg";

const g = globalThis as unknown as { __lrPool?: Pool };

export const pool: Pool =
  g.__lrPool ?? (g.__lrPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));

// A connection dropped while idle (DB restart) must not crash the process; the pool opens a new one.
if (!pool.listenerCount("error")) pool.on("error", (e) => console.error("[db] boşta bağlantı hatası:", e.message));

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<T[]> {
  const r = await (client ?? pool).query(sql, params);
  return r.rows as T[];
}

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
