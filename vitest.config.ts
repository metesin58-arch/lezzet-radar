import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        "postgres://lezzet:lezzet@localhost:5433/lezzet_test",
    },
  },
});
