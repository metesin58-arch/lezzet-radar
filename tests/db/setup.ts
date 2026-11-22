import { Client } from "pg";
import { migrate } from "../../scripts/migrate";

/** Test veritabanını sıfırdan oluşturur ve migration'ları uygular. */
export async function resetTestDb(): Promise<void> {
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const c = new Client({ connectionString: admin.toString() });
  await c.connect();
  await c.query(
    `select pg_terminate_backend(pid) from pg_stat_activity where datname=$1 and pid<>pg_backend_pid()`,
    [dbName],
  );
  await c.query(`drop database if exists "${dbName}"`);
  await c.query(`create database "${dbName}"`);
  await c.end();
  await migrate(url.toString());
}

/** Tüm tabloları boşaltır (şema korunur). */
export async function truncateAll(): Promise<void> {
  const { query } = await import("../../src/lib/db");
  await query(
    `truncate reviews, place_foods, places, coverage, scrape_jobs restart identity cascade`,
  );
}
