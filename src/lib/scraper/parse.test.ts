import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseScraperOutput } from "./parse";

const FIXTURE = readFileSync(join(__dirname, "../../../fixtures/lahmacun-kadikoy.jsonl"), "utf8");

describe("parseScraperOutput", () => {
  it("fixture'daki 16 mekanı reddetmeden okur", () => {
    const { places, rejected } = parseScraperOutput(FIXTURE);
    expect(places).toHaveLength(16);
    expect(rejected).toEqual([]);
  });

  it("Halil Lahmacun alanlarını doğru eşler", () => {
    const p = parseScraperOutput(FIXTURE).places.find((x) => x.title === "Halil Lahmacun")!;
    expect(p.rating).toBe(4.1);
    expect(p.reviewCount).toBe(3214);
    expect(p.reviews).toHaveLength(5);
    expect(p.reviews[0].author).toBe("onur cora");
    expect(p.reviews[0].rating).toBe(3);
    expect(p.reviews[0].relativeTime).toBe("bir ay önce");
    expect(p.district).toBe("Kadıköy");
    expect(p.openHours?.Pazartesi).toEqual(["Kapalı"]);
    expect(p.placeId).toBe("ChIJ1eAEvGe4yhQRXF1jGd_AmPs");
    expect(p.lat).toBeCloseTo(40.98964, 4);
    expect(p.reviewsPerRating?.["5"]).toBe(1841);
  });

  it("kesik son satırı invalid_json olarak reddeder, kalanları alır", () => {
    const lines = FIXTURE.trim().split("\n");
    const last = lines.pop()!;
    const input = [...lines, last.slice(0, last.length / 2)].join("\n");
    const { places, rejected } = parseScraperOutput(input);
    expect(places).toHaveLength(15);
    expect(rejected).toEqual([{ line: 16, reason: "invalid_json" }]);
  });

  it("boş girdi boş sonuç verir", () => {
    expect(parseScraperOutput("")).toEqual({ places: [], rejected: [] });
  });

  it("0,0 koordinatlı satırı reddeder", () => {
    const row = JSON.parse(FIXTURE.split("\n")[0]);
    row.latitude = 0;
    row.longitude = 0;
    row.longtitude = 0;
    const { places, rejected } = parseScraperOutput(JSON.stringify(row));
    expect(places).toEqual([]);
    expect(rejected[0].reason).toBe("invalid_coords");
  });

  it("place_id veya başlık yoksa ve puan aralık dışıysa reddeder", () => {
    const row = JSON.parse(FIXTURE.split("\n")[0]);
    const noId = { ...row, place_id: "" };
    const badRating = { ...row, place_id: "x", review_rating: 7 };
    const { rejected } = parseScraperOutput([noId, badRating].map((r) => JSON.stringify(r)).join("\n"));
    expect(rejected.map((r) => r.reason)).toEqual(["missing_id", "invalid_rating"]);
  });

  it("aynı place_id iki kez gelirse sonuncusu kalır", () => {
    const row = JSON.parse(FIXTURE.split("\n")[0]);
    const again = { ...row, review_rating: 4.5 };
    const { places } = parseScraperOutput([row, again].map((r) => JSON.stringify(r)).join("\n"));
    expect(places).toHaveLength(1);
    expect(places[0].rating).toBe(4.5);
  });
});
