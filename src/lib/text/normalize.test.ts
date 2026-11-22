import { describe, it, expect } from "vitest";
import { normalizeTr, matchFood, foodKeyForQuery } from "./normalize";

describe("normalizeTr", () => {
  it("Türkçe karakterleri ve büyük İ/I'yı doğru indirger", () => {
    expect(normalizeTr("İSKENDER Çiğ  Köfte!")).toBe("iskender cig kofte");
    expect(normalizeTr("ISPANAKLI")).toBe("ispanakli");
  });
});

describe("matchFood", () => {
  it.each([
    ["Çiğ Köfte", "cigkofte"],
    ["CIGKOFTE", "cigkofte"],
    ["çiğköfteci", "cigkofte"],
    ["LAHMACUN", "lahmacun"],
    ["İskender", "iskender"],
    ["burger", "hamburger"],
  ])("%s → %s", (input, slug) => {
    expect(matchFood(input)?.slug).toBe(slug);
  });

  it("bilinmeyen yemekte null döner", () => {
    expect(matchFood("kumru")).toBeNull();
    expect(matchFood("")).toBeNull();
  });
});

describe("foodKeyForQuery", () => {
  it("eşleşmeyen metin q: önekli normalize anahtar olur", () => {
    expect(foodKeyForQuery("Su Böreği ")).toBe("q:su boregi");
    expect(foodKeyForQuery("lahmacun")).toBe("lahmacun");
  });
});
