import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: isCI,
  workers: isCI ? 2 : 1,
  retries: isCI ? 1 : 0,
  timeout: 30_000,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5138",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bunx vite --port 5138",
    port: 5138,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});
