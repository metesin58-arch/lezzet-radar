import { describe, it, expect } from "vitest";
import { isClosedPermanently, isFoodPlace, nameMatchesFood } from "./matching";
import { FOOD_BY_SLUG } from "../config/foods";

describe("matching", () => {
  it("kapanmış mekanları tanır", () => {
    expect(isClosedPermanently("Kalıcı olarak kapandı")).toBe(true);
    expect(isClosedPermanently("Geçici olarak kapandı")).toBe(true);
    expect(isClosedPermanently("Permanently closed")).toBe(true);
    expect(isClosedPermanently("")).toBe(false);
    expect(isClosedPermanently("Peynirli pide sunan salaş restoran")).toBe(false);
  });
  it("yemek dışı kategorileri eler", () => {
    expect(isFoodPlace(["Süpermarket"])).toBe(false);
    expect(isFoodPlace(["Otel", "Restoran"])).toBe(true);
    expect(isFoodPlace([])).toBe(true);
  });
  it("isim/kategori ile yemek eşleşmesi", () => {
    const l = FOOD_BY_SLUG.lahmacun;
    expect(nameMatchesFood({ title: "Filfil Lahmacun", categories: ["Restoran"] }, l)).toBe(true);
    expect(nameMatchesFood({ title: "Çinili Taş Fırın Moda", categories: ["Restoran"] }, l)).toBe(false);
    expect(nameMatchesFood({ title: "Mavi", categories: ["Pizza restoranı"] }, FOOD_BY_SLUG.pizza)).toBe(true);
  });
});

describe("final review fixes (matching)", () => {
  it("özet metninde 'kapanan' geçen açık mekanı kapalı saymaz", () => {
    expect(isClosedPermanently("Geç saatte kapanan samimi meyhane")).toBe(false);
    expect(isClosedPermanently("Geçici olarak kapandı")).toBe(true);
    expect(isClosedPermanently("Temporarily closed")).toBe(true);
  });
});
