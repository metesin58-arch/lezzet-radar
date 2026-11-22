import { FOODS } from "../src/config/foods";
import { DISTRICTS } from "../src/config/districts";
import { cellCenter, cellIdFor, cellsInBBox } from "../src/lib/geo/grid";
import { getCoverage, isFresh } from "../src/lib/repo/coverage";
import { enqueueJob, PRIORITY } from "../src/lib/repo/jobs";

export type SeedJob = { cellId: string; foodKey: string; keyword: string; lat: number; lng: number };

export const CENTER_BBOX = [40.96, 28.85, 41.12, 29.15] as const;

/** Wave 1: central bbox cells; wave 2: the center cells of the remaining districts. Each × all foods. */
export function planSeedJobs(foods = FOODS): SeedJob[] {
  const wave1 = cellsInBBox(...CENTER_BBOX);
  const seen = new Set(wave1);
  const wave2: string[] = [];
  for (const d of DISTRICTS) {
    const c = cellIdFor(d.lat, d.lng);
    if (!seen.has(c)) {
      seen.add(c);
      wave2.push(c);
    }
  }
  const out: SeedJob[] = [];
  for (const cellId of [...wave1, ...wave2]) {
    const { lat, lng } = cellCenter(cellId);
    for (const f of foods) out.push({ cellId, foodKey: f.slug, keyword: f.query, lat, lng });
  }
  return out;
}

export async function seedIstanbul(o: { only?: string; limit?: number } = {}) {
  const foods = o.only ? FOODS.filter((f) => f.slug === o.only) : FOODS;
  if (!foods.length) throw new Error(`Bilinmeyen yemek: ${o.only}`);
  let enqueued = 0;
  let skipped = 0;
  for (const j of planSeedJobs(foods)) {
    if (o.limit !== undefined && enqueued >= o.limit) break;
    const cov = await getCoverage(j.cellId, j.foodKey);
    if (cov && isFresh(cov)) {
      skipped++;
      continue;
    }
    await enqueueJob({ ...j, priority: PRIORITY.seed });
    enqueued++;
  }
  return { enqueued, skipped };
}

if (require.main === module) {
  const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  const limit = arg("limit");
  seedIstanbul({ only: arg("only"), limit: limit ? Number(limit) : undefined })
    .then(async (r) => {
      console.log(`Kuyruğa eklenen: ${r.enqueued}, taze olduğu için atlanan: ${r.skipped}`);
      console.log(`Tahmini süre (tek worker, iş başına ~25 sn): ~${Math.round((r.enqueued * 25) / 3600)} saat`);
      const { pool } = await import("../src/lib/db");
      await pool.end();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
