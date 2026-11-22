import { describe, it, expect } from "vitest";
import { clientKey } from "./clientKey";

describe("clientKey", () => {
  const h = (xff?: string) => new Headers(xff ? { "x-forwarded-for": xff } : {});
  it("proxy güvenilmiyorsa X-Forwarded-For yok sayılır, ortak anahtar ve yüksek limit", () => {
    expect(clientKey(h("1.2.3.4"), false)).toEqual({ key: "all", limit: 30 });
  });
  it("proxy arkasında ilk IP kullanılır, kişi başı limit 5", () => {
    expect(clientKey(h("1.2.3.4, 10.0.0.1"), true)).toEqual({ key: "1.2.3.4", limit: 5 });
  });
});
