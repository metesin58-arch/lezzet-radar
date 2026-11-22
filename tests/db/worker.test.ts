import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { FIXTURE_JSONL, fixturePlaces } from "./fixtures";
import { enqueueJob, claimJob, getJob } from "../../src/lib/repo/jobs";
import { getCoverage } from "../../src/lib/repo/coverage";
import { upsertPlaces } from "../../src/lib/repo/places";
import { processJob } from "../../src/worker/processJob";
import type { ScrapeRunner } from "../../src/lib/scraper/run";
import { query } from "../../src/lib/db";
import { FOOD_BY_SLUG } from "../../src/config/foods";

const J = { cellId: "2203:1209", foodKey: "lahmacun", keyword: "lahmacun", lat: 40.99, lng: 29.03, priority: 10 };
const runner = (stdout: string, exitCode = 0): ScrapeRunner => async () => ({ exitCode, stdout, log: "" });
const countPlaces = async () => Number((await query<{ n: string }>(`select count(*) n from places`))[0].n);

describe("processJob", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("başarılı çıktı: mekanlar yazılır, iş done, coverage işaretlenir", async () => {
    const { id } = await enqueueJob(J);
    await processJob((await claimJob())!, runner(FIXTURE_JSONL));
    const j = await getJob(id);
    expect(j!.status).toBe("done");
    expect(j!.resultCount).toBe(16);
    expect((await getCoverage(J.cellId, "lahmacun"))!.resultCount).toBe(16);
    expect(await countPlaces()).toBe(16);
  });

  it("exit code ≠ 0: iş tekrar pending, mevcut veri bozulmaz", async () => {
    await upsertPlaces(fixturePlaces(), "lahmacun", FOOD_BY_SLUG.lahmacun);
    const { id } = await enqueueJob(J);
    await processJob((await claimJob())!, runner("", 1));
    const j = await getJob(id);
    expect(j!.status).toBe("pending");
    expect(j!.attempts).toBe(1);
    expect(await countPlaces()).toBe(16);
    expect(await getCoverage(J.cellId, "lahmacun")).toBeNull();
  });

  it("üç kez boş çıktı: iş done, sonuç 0", async () => {
    const { id } = await enqueueJob(J);
    for (let i = 0; i < 3; i++) await processJob((await claimJob())!, runner(""));
    const j = await getJob(id);
    expect(j!.status).toBe("done");
    expect(j!.resultCount).toBe(0);
    expect((await getCoverage(J.cellId, "lahmacun"))!.resultCount).toBe(0);
  });

  it("kesik son satır: 15 mekan yazılır, iş done", async () => {
    const lines = FIXTURE_JSONL.trim().split("\n");
    const last = lines.pop()!;
    const { id } = await enqueueJob(J);
    await processJob((await claimJob())!, runner([...lines, last.slice(0, 50)].join("\n")));
    expect((await getJob(id))!.resultCount).toBe(15);
  });

  it("serbest metin işi q: anahtarıyla yazılır", async () => {
    const { id } = await enqueueJob({ ...J, foodKey: "q:kumru", keyword: "kumru" });
    await processJob((await claimJob())!, runner(FIXTURE_JSONL));
    expect((await getJob(id))!.status).toBe("done");
    const [{ n }] = await query<{ n: string }>(`select count(*) n from place_foods where food_key='q:kumru'`);
    expect(Number(n)).toBe(16);
  });
});
