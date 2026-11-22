import { describe, it, expect } from "vitest";
import { cellIdFor, cellCenter, neighborCells, cellsInBBox, haversineM } from "./grid";
import { nearestDistrict, DISTRICTS } from "../../config/districts";
import { FOODS } from "../../config/foods";

describe("grid", () => {
  it("hücre merkezi noktaya en fazla 1.5 km uzaktadır", () => {
    const c = cellCenter(cellIdFor(41.0, 29.0));
    expect(haversineM(41.0, 29.0, c.lat, c.lng)).toBeLessThanOrEqual(1500);
  });
  it("yakın iki nokta aynı hücrededir", () => {
    const id = cellIdFor(41.0, 29.0);
    const c = cellCenter(id);
    expect(cellIdFor(c.lat + 0.001, c.lng + 0.001)).toBe(id);
  });
  it("8 farklı komşu döner", () => {
    const n = neighborCells(cellIdFor(41.0, 29.0));
    expect(new Set(n).size).toBe(8);
    expect(n).not.toContain(cellIdFor(41.0, 29.0));
  });
  it("bbox içindeki hücreleri listeler", () => {
    const cells = cellsInBBox(40.96, 28.85, 41.12, 29.15);
    expect(cells.length).toBeGreaterThan(50);
    expect(cells).toContain(cellIdFor(41.0, 29.0));
    expect(new Set(cells).size).toBe(cells.length);
  });
});

describe("config", () => {
  it("Kadıköy en yakın ilçe bulunur", () => {
    expect(nearestDistrict(40.9905, 29.029).name).toBe("Kadıköy");
  });
  it("39 ilçe ve 20 yemek var, slug'lar tekil", () => {
    expect(DISTRICTS.length).toBe(39);
    expect(FOODS.length).toBe(20);
    expect(new Set(FOODS.map((f) => f.slug)).size).toBe(20);
    expect(FOODS.filter((f) => f.popular).map((f) => f.slug)).toEqual([
      "cigkofte", "lahmacun", "doner", "kebap", "hamburger", "pizza", "balik",
    ]);
  });
});
