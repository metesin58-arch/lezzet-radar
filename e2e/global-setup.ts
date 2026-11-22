import { resetTestDb } from "../tests/db/setup";
import { seedFixture } from "./helpers";

export default async function globalSetup() {
  await resetTestDb();
  await seedFixture();
  const { pool } = await import("../src/lib/db");
  await pool.end();
}
