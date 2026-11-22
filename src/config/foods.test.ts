import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { FOODS } from "./foods";

describe("kategori görselleri", () => {
  it("ana sayfadaki 7 popüler yemeğin görseli var ve dosyalar küçük", () => {
    for (const f of FOODS.filter((x) => x.popular)) {
      expect(f.image, f.slug).toBe(`/categories/${f.slug}.webp`);
      const file = join(__dirname, "../../public", f.image!);
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeLessThan(80_000);
    }
  });
  it("görseli olmayan yemekler emoji ile kalır", () => {
    expect(FOODS.find((f) => f.slug === "manti")!.image).toBeUndefined();
  });
});
