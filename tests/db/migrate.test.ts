import { describe, it, expect, afterAll } from "vitest";
import { Client } from "pg";
import { resetTestDb } from "./setup";
import { migrate } from "../../scripts/migrate";

describe("migrate", () => {
  let c: Client | undefined;
  afterAll(async () => c?.end());

  it("tüm tabloları oluşturur ve tekrar çalıştırılabilir", async () => {
    await resetTestDb();
    await migrate(process.env.DATABASE_URL!); // idempotent
    c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    const { rows } = await c.query(
      `select table_name from information_schema.tables where table_schema='public'`,
    );
    const names = rows.map((r) => r.table_name);
    for (const t of ["places", "reviews", "place_foods", "coverage", "scrape_jobs", "schema_migrations"]) {
      expect(names).toContain(t);
    }
  });
});
