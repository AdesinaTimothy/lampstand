import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a seeded database (`npm run db:seed`) with
 * MAIL_DRIVER=log, so tests can read verification emails from /dev/mail.
 *
 *   E2E_BASE_URL=http://localhost:3000 npm run test:e2e   # against a running dev server
 *   npm run build && npm run test:e2e                     # starts `next start` on :3200
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start -- -p 3200", url: `${baseURL}/api/health`, reuseExistingServer: true, timeout: 120_000 },
});
