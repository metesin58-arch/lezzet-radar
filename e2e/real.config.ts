import { defineConfig, devices } from "@playwright/test";

/** Real scraper test: `docker compose up` must already be running at BASE_URL (default :3000). */
export default defineConfig({
  testDir: ".",
  testMatch: /real\.spec\.ts/,
  workers: 1,
  timeout: 8 * 60_000,
  use: {
    ...devices["iPhone 14"],
    browserName: "chromium",
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    geolocation: { latitude: 41.043, longitude: 29.007 }, // Beşiktaş
    permissions: ["geolocation"],
    locale: "tr-TR",
    trace: "off",
  },
});
