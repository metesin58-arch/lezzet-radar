import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const DIR = join(__dirname, "..", "db", "migrations");

/** db/migrations altındaki .sql dosyalarını ad sırasıyla, bir kez uygular. */
export async function migrate(url = process.env.DATABASE_URL): Promise<void> {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(
      `create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`,
    );
    const done = new Set(
      (await c.query(`select name from schema_migrations`)).rows.map((r) => r.name),
    );
    for (const f of readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort()) {
      if (done.has(f)) continue;
      await c.query("begin");
      try {
        await c.query(readFileSync(join(DIR, f), "utf8"));
        await c.query(`insert into schema_migrations(name) values ($1)`, [f]);
        await c.query("commit");
      } catch (e) {
        await c.query("rollback");
        throw e;
      }
    }
  } finally {
    await c.end();
  }
}

if (require.main === module) {
  migrate()
    .then(() => console.log("migration tamam"))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
