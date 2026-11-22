import { defineConfig, devices } from "@playwright/test";

const E2E_DB = process.env.DATABASE_URL_E2E ?? "postgres://lezzet:lezzet@localhost:5433/lezzet_e2e";
process.env.DATABASE_URL = E2E_DB;

export default defineConfig({
  testDir: "e2e",
  testIgnore: /real\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    ...devices["iPhone 14"],
    browserName: "chromium",
    baseURL: "http://localhost:3100",
    geolocation: { latitude: 40.9905, longitude: 29.029 },
    permissions: ["geolocation"],
    locale: "tr-TR",
    trace: "off",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100/api/places",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: E2E_DB },
  },
});
