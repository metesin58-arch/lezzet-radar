import { test, expect } from "@playwright/test";

const SHOTS = process.env.SHOTS_DIR ?? "docs/screenshots";
const FOOD = process.env.FOOD ?? "pizza";

test(`gerçek scraper: Beşiktaş'ta ${FOOD} aranır, yorumlu sonuçlar gelir`, async ({ page }) => {
  await page.goto(`/ara?food=${FOOD}`);
  const loading = page.getByText("Senin için en lezzetli noktaları buluyorum…");
  const cards = page.getByTestId("place-card");
  await expect(loading.or(cards.first())).toBeVisible();
  if (await loading.isVisible()) await page.screenshot({ path: `${SHOTS}/gercek-yukleniyor.png` });

  await expect(cards.nth(7)).toBeVisible({ timeout: 5 * 60_000 });
  await page.screenshot({ path: `${SHOTS}/gercek-${FOOD}-besiktas.png` });

  await cards.first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("review").first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/gercek-detay.png`, fullPage: true });
});
