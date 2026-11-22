import { test, expect } from "@playwright/test";
import { ANKARA, fixture } from "./helpers";
import { query } from "../src/lib/db";
import { upsertPlaces } from "../src/lib/repo/places";
import { completeJob } from "../src/lib/repo/jobs";
import { markCovered } from "../src/lib/repo/coverage";
import { FOOD_BY_SLUG } from "../src/config/foods";

const LOADING = "Senin için en lezzetli noktaları buluyorum…";

test("lahmacun listesi en az 8 kart gösterir", async ({ page }) => {
  await page.goto("/ara?food=lahmacun");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lahmacun");
  await expect(page.getByTestId("place-card").nth(7)).toBeVisible();
});

test("En yakın sıralaması mesafeye göre dizer", async ({ page }) => {
  await page.goto("/ara?food=lahmacun");
  await page.getByRole("button", { name: "En yakın" }).click();
  await expect(page.getByRole("button", { name: "En yakın" })).toHaveAttribute("aria-pressed", "true");
  const cards = page.getByTestId("place-card");
  await expect(cards.nth(1)).toBeVisible();
  const d = await cards.evaluateAll((els) => els.slice(0, 3).map((e) => Number(e.getAttribute("data-distance"))));
  expect(d[0]).toBeLessThanOrEqual(d[1]);
  expect(d[1]).toBeLessThanOrEqual(d[2]);
});

test("hiç taranmamış bölgede yükleme ekranı gösterilir ve iş bitince sonuçlar gelir", async ({ page, context }) => {
  await context.setGeolocation(ANKARA);
  await page.goto("/ara?food=lahmacun");
  await expect(page.getByText(LOADING)).toBeVisible();

  // Simulate the worker: write places near Ankara and mark the job done.
  const [job] = await query<{ id: string; cell_id: string }>(
    `select id, cell_id from scrape_jobs where food_key='lahmacun' and status='pending' order by created_at desc limit 1`,
  );
  expect(job).toBeDefined();
  const moved = fixture().slice(0, 9).map((p, i) => ({
    ...p,
    placeId: `ankara-${i}`,
    lat: ANKARA.latitude + (p.lat - 40.9905),
    lng: ANKARA.longitude + (p.lng - 29.029),
  }));
  await upsertPlaces(moved, "lahmacun", FOOD_BY_SLUG.lahmacun);
  await markCovered(job.cell_id, "lahmacun", 9);
  await completeJob(job.id, 9);

  await expect(page.getByTestId("place-card").first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(LOADING)).toHaveCount(0);
});

test("harita görünümüne geçilir ve pinler görünür", async ({ page }) => {
  await page.goto("/ara?food=lahmacun");
  await page.getByRole("button", { name: "Harita" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.locator(".lr-pin").first()).toBeVisible();
  await page.locator(".lr-pin").nth(2).click();
  await expect(page.locator("[data-testid=place-card][data-active=true]")).toBeInViewport();
});

test("konum izni yoksa ilçe seçici açılır", async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: [], locale: "tr-TR" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3100/");
  await expect(page.getByRole("dialog", { name: "Neredesin?" })).toBeVisible();
  await page.getByRole("button", { name: "Kadıköy" }).click();
  await expect(page.getByText("Kadıköy, İstanbul")).toBeVisible();
  await ctx.close();
});
