import { test, expect } from "@playwright/test";

const HALIL = "ChIJ1eAEvGe4yhQRXF1jGd_AmPs";

test("detay sayfası yorumları, puan dağılımını ve yol tarifini gösterir", async ({ page }) => {
  await page.goto(`/mekan/${HALIL}`);
  await expect(page.getByRole("heading", { level: 1, name: "Halil Lahmacun" })).toBeVisible();
  await expect(page.getByTestId("review")).toHaveCount(5);
  await expect(page.getByTestId("rating-bar")).toHaveCount(5);
  const nav = page.getByRole("link", { name: "Yol tarifi" });
  await expect(nav).toHaveAttribute("href", new RegExp(`destination_place_id=${HALIL}`));
  await expect(page.getByRole("link", { name: "Ara" })).toHaveAttribute("href", "tel:+902163370123");
  await expect(page.getByRole("link", { name: /Tüm yorumları Google Maps'te gör/ })).toBeVisible();
});

test("listeden detaya gidilir", async ({ page }) => {
  await page.goto("/ara?food=lahmacun");
  await page.getByTestId("place-card").first().click();
  await expect(page).toHaveURL(/\/mekan\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("favoriye eklenen mekan favoriler sayfasında görünür", async ({ page }) => {
  await page.goto("/favoriler");
  await expect(page.getByText("Henüz favorin yok")).toBeVisible();
  await page.goto(`/mekan/${HALIL}`);
  await page.getByRole("button", { name: "Favorilere ekle" }).click();
  await page.goto("/favoriler");
  await expect(page.getByText("Halil Lahmacun")).toBeVisible();
});

test("olmayan mekan için bulunamadı mesajı", async ({ page }) => {
  await page.goto("/mekan/yok-boyle-bir-yer");
  await expect(page.getByText("Mekan bulunamadı")).toBeVisible();
});
