import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "src"),
  // Server modules guard against client import; irrelevant under test.
  "server-only": path.resolve(__dirname, "tests/stubs/empty.ts"),
};

const testEnv: Partial<NodeJS.ProcessEnv> = {
  NODE_ENV: "test",
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/lampstand_test?schema=public",
  APP_SECRET: "test-secret-that-is-long-enough",
  APP_URL: "http://localhost:3000",
  APP_ORGANIZATION_SLUG: "test-church",
  STORAGE_DRIVER: "local",
  STORAGE_LOCAL_DIR: "./.test-storage",
  MAIL_DRIVER: "log",
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node", env: testEnv },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          env: testEnv,
          globalSetup: ["tests/integration/global-setup.ts"],
          // One shared database: run files serially.
          pool: "forks",
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
