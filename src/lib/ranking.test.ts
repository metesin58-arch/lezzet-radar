import { describe, it, expect } from "vitest";
import { bayesScore, finalScore, sortPlaces } from "./ranking";

const p = (o: Partial<{ rating: number | null; reviewCount: number; distanceM: number; nameMatch: boolean; id: string }>) => ({
  id: "x", rating: 4.5, reviewCount: 100, distanceM: 500, nameMatch: false, ...o,
});

describe("bayesScore", () => {
  it("az yorumlu 5.0, çok yorumlu 4.7'nin önüne geçemez", () => {
    expect(bayesScore(5, 16)).toBeLessThan(bayesScore(4.7, 1053));
  });
  it("182 yorumlu 5.0, 3214 yorumlu 4.1'in önündedir", () => {
    expect(bayesScore(5, 182)).toBeGreaterThan(bayesScore(4.1, 3214));
  });
  it("puansız mekan 4.2 kabul edilir", () => {
    expect(bayesScore(null, 0)).toBeCloseTo(4.2);
  });
});

describe("finalScore / sortPlaces", () => {
  it("aynı puanda yakın olan öndedir", () => {
    expect(finalScore(p({ distanceM: 300 }))).toBeGreaterThan(finalScore(p({ distanceM: 3000 })));
  });
  it("isim eşleşmesi 0.1 puan ekler", () => {
    expect(finalScore(p({ nameMatch: true })) - finalScore(p({}))).toBeCloseTo(0.1);
  });
  it("sıralama anahtarlarına göre sıralar", () => {
    const list = [
      p({ id: "a", distanceM: 900, rating: 4.9, reviewCount: 50 }),
      p({ id: "b", distanceM: 100, rating: 4.0, reviewCount: 3000 }),
      p({ id: "c", distanceM: 400, rating: 4.6, reviewCount: 900 }),
    ];
    expect(sortPlaces(list, "yakin").map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(sortPlaces(list, "puan").map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect(sortPlaces(list, "yorum").map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(sortPlaces(list, "onerilen")[0].id).toBe("c");
  });
});
