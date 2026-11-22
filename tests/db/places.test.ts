import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { fixturePlaces, KADIKOY } from "./fixtures";
import { upsertPlaces, findNearby, getPlace } from "../../src/lib/repo/places";
import { query } from "../../src/lib/db";
import { FOOD_BY_SLUG } from "../../src/config/foods";

const L = FOOD_BY_SLUG.lahmacun;

describe("places repo", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("upsert sonrası yakındaki 16 lahmacuncu bulunur", async () => {
    expect(await upsertPlaces(fixturePlaces(), "lahmacun", L)).toBe(16);
    const rows = await findNearby({ ...KADIKOY, radiusM: 2000, foodKey: "lahmacun" });
    expect(rows).toHaveLength(16);
    for (const r of rows) expect(r.distanceM).toBeLessThanOrEqual(2000);
    expect(rows.find((r) => r.title === "Filfil Lahmacun")!.nameMatch).toBe(true);
    expect(rows.find((r) => r.title === "Çinili Taş Fırın Moda")!.nameMatch).toBe(false);
  });

  it("topReview 4-5 yıldızlı en uzun yorumdur", async () => {
    await upsertPlaces(fixturePlaces(), "lahmacun", L);
    const r = (await findNearby({ ...KADIKOY, radiusM: 2000, foodKey: "lahmacun" })).find((x) => x.title === "Halil Lahmacun")!;
    expect(r.topReview).not.toBeNull();
    expect(r.topReview!.rating).toBeGreaterThanOrEqual(4);
  });

  it("tekrar upsert yorumları çoğaltmaz, yeni puanı yazar", async () => {
    await upsertPlaces(fixturePlaces(), "lahmacun", L);
    const [{ n }] = await query<{ n: string }>(`select count(*) n from reviews`);
    const changed = fixturePlaces().map((p) => (p.title === "Halil Lahmacun" ? { ...p, rating: 3.3 } : p));
    await upsertPlaces(changed, "lahmacun", L);
    const [{ n: n2 }] = await query<{ n: string }>(`select count(*) n from reviews`);
    expect(n2).toBe(n);
    const d = await getPlace("ChIJ1eAEvGe4yhQRXF1jGd_AmPs");
    expect(d!.rating).toBe(3.3);
    expect(d!.reviews).toHaveLength(5);
    expect(d!.reviewsPerRating!["5"]).toBe(1841);
  });

  it("kapanmış mekan listelenmez", async () => {
    const ps = fixturePlaces().map((p) => (p.title === "Filfil Lahmacun" ? { ...p, status: "Kalıcı olarak kapandı" } : p));
    await upsertPlaces(ps, "lahmacun", L);
    const rows = await findNearby({ ...KADIKOY, radiusM: 2000, foodKey: "lahmacun" });
    expect(rows.map((r) => r.title)).not.toContain("Filfil Lahmacun");
  });

  it("başka yemek anahtarıyla aranınca sonuç yok, foodKeys ile var", async () => {
    await upsertPlaces(fixturePlaces(), "lahmacun", L);
    expect(await findNearby({ ...KADIKOY, radiusM: 2000, foodKey: "pizza" })).toHaveLength(0);
    expect(await findNearby({ ...KADIKOY, radiusM: 2000, foodKeys: ["pizza", "lahmacun"] })).toHaveLength(16);
  });

  it("yemek dışı mekanları yazmaz", async () => {
    const ps = fixturePlaces().slice(0, 2).map((p, i) => (i === 0 ? { ...p, categories: ["Süpermarket"] } : p));
    expect(await upsertPlaces(ps, "lahmacun", L)).toBe(1);
  });
});
