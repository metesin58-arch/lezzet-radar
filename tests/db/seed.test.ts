import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { planSeedJobs, seedIstanbul } from "../../scripts/seed-istanbul";
import { cellIdFor } from "../../src/lib/geo/grid";
import { markCovered } from "../../src/lib/repo/coverage";
import { query } from "../../src/lib/db";

const active = async () =>
  Number((await query<{ n: string }>(`select count(*) n from scrape_jobs where status in ('pending','running')`))[0].n);

describe("seed", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("plan tekrarsızdır, Kadıköy×lahmacun içerir, 1500-4000 iş arasıdır", () => {
    const plan = planSeedJobs();
    const keys = plan.map((j) => `${j.cellId}|${j.foodKey}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(`${cellIdFor(40.991, 29.027)}|lahmacun`);
    expect(plan.length).toBeGreaterThanOrEqual(1500);
    expect(plan.length).toBeLessThanOrEqual(4000);
    // Dense area first: the first job is inside the central bbox
    expect(plan[0].lat).toBeGreaterThan(40.95);
    // Silivri (outer district) is in wave 2
    expect(keys.indexOf(`${cellIdFor(41.073, 28.246)}|lahmacun`)).toBeGreaterThan(keys.indexOf(`${cellIdFor(40.991, 29.027)}|lahmacun`));
  });

  it("iki kez çalıştırmak aktif işleri artırmaz, taze coverage atlanır", async () => {
    await markCovered(cellIdFor(40.991, 29.027), "lahmacun", 16);
    const first = await seedIstanbul({ only: "lahmacun" });
    const n = await active();
    expect(n).toBe(first.enqueued);
    expect(first.skipped).toBe(1);
    await seedIstanbul({ only: "lahmacun" });
    expect(await active()).toBe(n);
    const [{ p }] = await query<{ p: number }>(`select max(priority) p from scrape_jobs`);
    expect(p).toBe(0);
  });

  it("limit parametresine uyar", async () => {
    expect((await seedIstanbul({ only: "pizza", limit: 5 })).enqueued).toBe(5);
    expect(await active()).toBe(5);
  });
});
