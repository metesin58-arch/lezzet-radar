import { describe, it, expect } from "vitest";
import { isOpenNow } from "./openNow";

// 2026-11-23 Pazartesi. TR = UTC+3.
const MON_13 = new Date("2026-11-23T10:00:00Z");
const FRI_17 = new Date("2026-11-27T14:00:00Z");
const SAT_0130 = new Date("2026-11-27T22:30:00Z");

const week = (h: string[]) =>
  Object.fromEntries(["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((d) => [d, h]));

describe("isOpenNow", () => {
  it("Kapalı gün false", () => {
    expect(isOpenNow({ ...week(["11:30–20:30"]), Pazartesi: ["Kapalı"] }, MON_13)).toBe(false);
  });
  it("aralık içi true", () => {
    expect(isOpenNow(week(["11:30–20:30"]), MON_13)).toBe(true);
  });
  it("gece yarısını aşan aralık ertesi gün devam eder", () => {
    const h = { ...week(["Kapalı"]), Cuma: ["18:00–03:00"] };
    expect(isOpenNow(h, SAT_0130)).toBe(true);
    expect(isOpenNow(h, FRI_17)).toBe(false);
  });
  it("24 saat açık true", () => {
    expect(isOpenNow(week(["24 saat açık"]), MON_13)).toBe(true);
  });
  it("birden fazla aralık, arada kapalı", () => {
    expect(isOpenNow(week(["11:30–15:00", "18:00–22:00"]), new Date("2026-11-23T13:00:00Z"))).toBe(false);
  });
  it("normal tire de ayırıcı olabilir", () => {
    expect(isOpenNow(week(["09:00-14:00"]), MON_13)).toBe(true);
  });
  it("veri yoksa null", () => {
    expect(isOpenNow(null, MON_13)).toBeNull();
    expect(isOpenNow({ Salı: ["09:00–17:00"] }, MON_13)).toBeNull();
  });
});
