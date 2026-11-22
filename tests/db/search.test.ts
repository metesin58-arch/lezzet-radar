import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { fixturePlaces, KADIKOY } from "./fixtures";
import { upsertPlaces } from "../../src/lib/repo/places";
import { markCovered } from "../../src/lib/repo/coverage";
import { searchPlaces } from "../../src/lib/search";
import { cellIdFor, cellCenter, neighborCells } from "../../src/lib/geo/grid";
import { query } from "../../src/lib/db";
import { FOOD_BY_SLUG } from "../../src/config/foods";

const jobs = () => query<{ keyword: string; food_key: string; priority: number }>(`select keyword, food_key, priority from scrape_jobs`);

describe("searchPlaces", () => {
  beforeAll(resetTestDb);
  beforeEach(async () => {
    await truncateAll();
    await upsertPlaces(fixturePlaces(), "lahmacun", FOOD_BY_SLUG.lahmacun);
  });

  it("kapsanmış hücrede iş açmadan sonuç döner", async () => {
    await markCovered(cellIdFor(KADIKOY.lat, KADIKOY.lng), "lahmacun", 16);
    const r = await searchPlaces({ ...KADIKOY, food: "lahmacun", allowLive: true });
    expect(r.job).toBeNull();
    expect(r.refreshing).toBe(false);
    expect(r.radiusM).toBe(2000);
    expect(r.foodKey).toBe("lahmacun");
    expect(r.places.length).toBeGreaterThanOrEqual(8);
    expect(r.places[0]).toMatchObject({ id: expect.any(String), fewReviews: expect.any(Boolean) });
    expect(await jobs()).toHaveLength(0);
  });

  it("varsayılan sıralama önerilen skora göredir, Bolca Çarşı (16 yorum) ilk değildir", async () => {
    await markCovered(cellIdFor(KADIKOY.lat, KADIKOY.lng), "lahmacun", 16);
    const r = await searchPlaces({ ...KADIKOY, food: "lahmacun", allowLive: true });
    expect(r.places[0].title).not.toBe("Bolca Lahmacun Çarşı");
    expect(r.places.find((p) => p.title === "Bolca Lahmacun Çarşı")!.fewReviews).toBe(true);
  });

  it("hücre sınırındaki komşu noktadan da sonuç gelir", async () => {
    const n = cellCenter(neighborCells(cellIdFor(KADIKOY.lat, KADIKOY.lng))[0]);
    const r = await searchPlaces({ ...n, food: "lahmacun", allowLive: false });
    expect(r.places.length).toBeGreaterThan(0);
  });

  it("İstanbul dışında canlı iş açar", async () => {
    const r = await searchPlaces({ lat: 39.92, lng: 32.85, food: "lahmacun", allowLive: true });
    expect(r.places).toEqual([]);
    expect(r.job?.status).toBe("pending");
    const js = await jobs();
    expect(js).toEqual([{ keyword: "lahmacun", food_key: "lahmacun", priority: 10 }]);
  });

  it("serbest metin q: anahtarıyla iş açar", async () => {
    const r = await searchPlaces({ ...KADIKOY, q: "kumru", allowLive: true });
    expect(r.foodKey).toBe("q:kumru");
    expect((await jobs())[0]).toMatchObject({ keyword: "kumru", food_key: "q:kumru" });
  });

  it("serbest metin yemekle eşleşirse yemeğin sorgusu kullanılır", async () => {
    const r = await searchPlaces({ lat: 39.92, lng: 32.85, q: "Çiğ Köfte", allowLive: true });
    expect(r.foodKey).toBe("cigkofte");
    expect((await jobs())[0]).toMatchObject({ keyword: "çiğ köfte", food_key: "cigkofte" });
  });

  it("31 günlük coverage arka planda yenilenir", async () => {
    const cell = cellIdFor(KADIKOY.lat, KADIKOY.lng);
    await markCovered(cell, "lahmacun", 16);
    await query(`update coverage set last_scraped_at = now() - interval '31 days'`);
    const r = await searchPlaces({ ...KADIKOY, food: "lahmacun", allowLive: true });
    expect(r.refreshing).toBe(true);
    expect(r.job).toBeNull();
    expect(r.places.length).toBeGreaterThan(0);
    expect((await jobs())[0].priority).toBe(5);
  });

  it("allowLive false iken iş açılmaz", async () => {
    await searchPlaces({ lat: 39.92, lng: 32.85, food: "lahmacun", allowLive: false });
    expect(await jobs()).toHaveLength(0);
  });

  it("yemek seçilmeden: tüm yemekler listelenir, eksik popüler yemekler için iş açılır", async () => {
    const r = await searchPlaces({ ...KADIKOY, allowLive: true });
    expect(r.foodKey).toBeNull();
    expect(r.places.length).toBeGreaterThan(0);
    expect(r.job).not.toBeNull();
    expect((await jobs()).length).toBe(7);
  });

  it("şu an açık filtresi kapalı mekanları çıkarır", async () => {
    await markCovered(cellIdFor(KADIKOY.lat, KADIKOY.lng), "lahmacun", 16);
    const all = await searchPlaces({ ...KADIKOY, food: "lahmacun", allowLive: false });
    const open = await searchPlaces({ ...KADIKOY, food: "lahmacun", allowLive: false, openNow: true });
    expect(open.places.every((p) => p.openNow === true)).toBe(true);
    expect(open.places.length).toBeLessThanOrEqual(all.places.length);
  });
});
