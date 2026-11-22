import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("PWA manifest", () => {
  it("tam ekran açılan, Türkçe, ikonlu bir uygulama tanımlar", () => {
    const m = manifest();
    expect(m.name).toBe("Lezzet Radar");
    expect(m.short_name).toBe("Lezzet Radar");
    expect(m.lang).toBe("tr");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#ffffff");
    const sizes = (m.icons ?? []).map((i) => `${i.sizes}:${i.purpose ?? "any"}`);
    expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  });
});
