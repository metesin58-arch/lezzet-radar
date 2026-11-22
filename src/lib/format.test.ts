import { describe, it, expect } from "vitest";
import { formatDistance, walkMinutes, formatCount, formatRating } from "./format";

describe("format", () => {
  it("mesafe", () => {
    expect(formatDistance(650)).toBe("650 m");
    expect(formatDistance(1234)).toBe("1,2 km");
    expect(formatDistance(12)).toBe("10 m");
  });
  it("yürüme süresi (80 m/dk, en az 1)", () => {
    expect(walkMinutes(800)).toBe(10);
    expect(walkMinutes(10)).toBe(1);
  });
  it("sayı kısaltma", () => {
    expect(formatCount(3214)).toBe("3,2B");
    expect(formatCount(950)).toBe("950");
    expect(formatCount(12000)).toBe("12B");
  });
  it("puan tek ondalık, virgülle", () => {
    expect(formatRating(4.7)).toBe("4,7");
    expect(formatRating(5)).toBe("5,0");
    expect(formatRating(null)).toBe("–");
  });
});

import { foodVerb } from "./foodVerb";
import { FOOD_BY_SLUG } from "../config/foods";

describe("foodVerb", () => {
  it("ünlü uyumu ve sertleşme", () => {
    expect(foodVerb(FOOD_BY_SLUG.lahmacun)).toBe("Lahmacuncuları");
    expect(foodVerb(FOOD_BY_SLUG.cigkofte)).toBe("Çiğköfteci" + "leri");
    expect(foodVerb(FOOD_BY_SLUG.kebap)).toBe("Kebapçıları");
    expect(foodVerb(FOOD_BY_SLUG.balik)).toBe("Balıkçıları");
    expect(foodVerb(FOOD_BY_SLUG.doner)).toBe("Dönercileri");
  });
});
