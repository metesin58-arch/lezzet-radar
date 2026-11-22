import { test, expect } from "@playwright/test";

test("site ana ekrana eklenebilir (PWA)", async ({ page, request }) => {
  await page.goto("/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();

  const m = await (await request.get(manifestHref!)).json();
  expect(m.display).toBe("standalone");
  for (const icon of m.icons) {
    const r = await request.get(icon.src);
    expect(r.status(), icon.src).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }

  // iPhone: home-screen icon and full-screen launch
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect((await request.get(apple!)).status()).toBe(200);
  await expect(page.locator('meta[name="mobile-web-app-capable"][content="yes"]')).toHaveCount(1);
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "Lezzet Radar");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
});
