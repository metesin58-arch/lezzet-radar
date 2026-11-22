import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { FIXTURE_JSONL, fixturePlaces } from "./fixtures";
import { upsertPlaces, getPlace } from "../../src/lib/repo/places";
import { enqueueJob, claimJob, getJob, requeueStale, findActiveJob } from "../../src/lib/repo/jobs";
import { getCoverage, markCovered, isFresh } from "../../src/lib/repo/coverage";
import { processJob } from "../../src/worker/processJob";
import type { ScrapeRunner } from "../../src/lib/scraper/run";
import { searchPlaces } from "../../src/lib/search";
import { query } from "../../src/lib/db";
import { FOOD_BY_SLUG } from "../../src/config/foods";

const J = { cellId: "9:9", foodKey: "lahmacun", keyword: "lahmacun", lat: 40.99, lng: 29.03, priority: 10 };
const runner = (stdout: string | null, exitCode = 0): ScrapeRunner => async () => ({ exitCode, stdout, log: "" });
/** Makes the job claimable immediately, without waiting for the retry delay. */
const ready = () => query(`update scrape_jobs set run_after = now() - interval '1 second'`);

describe("final review fixes", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("C1: 5 KB'lık yorum upsert'i bozmaz", async () => {
    const ps = fixturePlaces();
    // Hard-to-compress text (real reviews compress poorly too); ~5 KB UTF-8
    const long = Array.from({ length: 600 }, (_, i) => `ş${((i * 7919) % 10007).toString(36)}ğü${(i * 104729) % 9973}`).join(" ");
    expect(Buffer.byteLength(long)).toBeGreaterThan(4000);
    ps[0] = { ...ps[0], reviews: [{ ...ps[0].reviews[0], text: long }] };
    await upsertPlaces(ps, "lahmacun", FOOD_BY_SLUG.lahmacun);
    const d = await getPlace(ps[0].placeId);
    expect(d!.reviews[0].text.length).toBe(long.length);
  });

  it("C1: işlem sırasında DB hatası olursa iş running'de kalmaz, yeniden denenir", async () => {
    const { id } = await enqueueJob(J);
    await query(`alter table place_foods rename to place_foods_x`);
    try {
      await processJob((await claimJob())!, runner(FIXTURE_JSONL));
    } finally {
      await query(`alter table place_foods_x rename to place_foods`);
    }
    const j = await getJob(id);
    expect(j!.status).toBe("pending");
    expect(j!.error).toMatch(/place_foods/);
  });

  it("C1: requeueStale deneme hakkı bitmiş işi failed yapar", async () => {
    const { id } = await enqueueJob(J);
    await query(`update scrape_jobs set status='running', attempts=3, started_at=now()-interval '20 minutes' where id=$1`, [id]);
    await requeueStale(15);
    expect((await getJob(id))!.status).toBe("failed");
  });

  it("C2: çıktı dosyası yoksa boş sonuç değil hata sayılır", async () => {
    const { id } = await enqueueJob(J);
    for (let i = 0; i < 3; i++) {
      await ready();
      await processJob((await claimJob())!, runner(null));
    }
    expect((await getJob(id))!.status).toBe("failed");
    expect(await getCoverage(J.cellId, "lahmacun")).toBeNull();
  });

  it("C2: tüm satırlar reddedilirse hata sayılır (format değişikliği)", async () => {
    const broken = FIXTURE_JSONL.replace(/"latitude":/g, '"lat_renamed":');
    const { id } = await enqueueJob(J);
    await processJob((await claimJob())!, runner(broken));
    const j = await getJob(id);
    expect(j!.status).toBe("pending");
    expect(j!.error).toMatch(/all_rejected/);
  });

  it("C2: yeniden deneme hemen değil gecikmeli yapılır", async () => {
    await enqueueJob(J);
    await processJob((await claimJob())!, runner("", 1));
    expect(await claimJob()).toBeNull();
    await ready();
    expect(await claimJob()).not.toBeNull();
  });

  it("C2: 0 sonuçlu coverage 3 gün, dolu coverage 30 gün tazedir", () => {
    const day = 86_400_000;
    expect(isFresh({ lastScrapedAt: new Date(Date.now() - 2 * day), resultCount: 0 })).toBe(true);
    expect(isFresh({ lastScrapedAt: new Date(Date.now() - 4 * day), resultCount: 0 })).toBe(false);
    expect(isFresh({ lastScrapedAt: new Date(Date.now() - 29 * day), resultCount: 5 })).toBe(true);
    expect(isFresh({ lastScrapedAt: new Date(Date.now() - 31 * day), resultCount: 5 })).toBe(false);
  });

  it("C2: processJob sonucu döner (boş = backoff'a sayılır)", async () => {
    await enqueueJob(J);
    expect(await processJob((await claimJob())!, runner(FIXTURE_JSONL))).toBe("ok");
    await enqueueJob({ ...J, cellId: "9:10" });
    expect(await processJob((await claimJob())!, runner(""))).toBe("empty");
  });

  it("I2: aktif iş varken rate limit hakkı harcanmaz, iş döner", async () => {
    await upsertPlaces(fixturePlaces(), "lahmacun", FOOD_BY_SLUG.lahmacun);
    let calls = 0;
    const allow = () => (calls++, calls <= 1);
    const first = await searchPlaces({ lat: 39.92, lng: 32.85, food: "lahmacun", allowLive: allow });
    for (let i = 0; i < 6; i++) {
      const r = await searchPlaces({ lat: 39.92, lng: 32.85, food: "lahmacun", allowLive: allow });
      expect(r.job?.id).toBe(first.job!.id);
    }
    expect(calls).toBe(1);
  });

  it("I2: limit aşılınca rateLimited bayrağı döner", async () => {
    const r = await searchPlaces({ lat: 39.92, lng: 32.85, food: "pizza", allowLive: () => false });
    expect(r.job).toBeNull();
    expect(r.rateLimited).toBe(true);
  });

  it("I3: serbest metin tek satırlık anahtar kelimeye dönüşür", async () => {
    await searchPlaces({ lat: 39.92, lng: 32.85, q: "kumru\nçiğ börek\r\n#!#x", allowLive: true });
    const [j] = await query<{ keyword: string }>(`select keyword from scrape_jobs`);
    expect(j.keyword).not.toMatch(/[\r\n]/);
    expect(j.keyword).not.toContain("#!#");
  });

  it("findActiveJob aktif işi bulur, bitmişi bulmaz", async () => {
    const { id } = await enqueueJob(J);
    expect((await findActiveJob(J.cellId, J.foodKey))!.id).toBe(id);
    await markCovered(J.cellId, J.foodKey, 1);
    await query(`update scrape_jobs set status='done'`);
    expect(await findActiveJob(J.cellId, J.foodKey)).toBeNull();
  });
});
