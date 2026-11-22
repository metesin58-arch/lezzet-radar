import { test, expect } from "@playwright/test";

test("ana sayfadaki kategori kutucukları fotoğraflı ve tıklanabilir", async ({ page }) => {
  await page.goto("/");
  const tile = page.getByRole("link", { name: "Lahmacun" });
  const img = tile.locator("img");
  await expect(img).toHaveAttribute("src", "/categories/lahmacun.webp");
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator(".grid img[src^='/categories/']")).toHaveCount(7);
  await tile.click();
  await expect(page).toHaveURL(/\/ara\?food=lahmacun/);
});

test("'Tümü' listesinde görseli olmayan yemekler emojiyle görünür", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tümü" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("link", { name: /Mantı/ })).toContainText("🥟");
  await expect(sheet.locator("img[src='/categories/pizza.webp']")).toHaveCount(1);
});
