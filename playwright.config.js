import { defineConfig, devices } from "@playwright/test";

const reportId = process.env.PLAYWRIGHT_RUN_ID ?? Date.now();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  workers: 1,
  outputDir: `playwright-artifacts/${reportId}`,
  expect: {
    timeout: 8_000,
  },
  reporter: [
    ["list"],
    ["json", { outputFile: `playwright-artifacts/playwright-results-${reportId}.json` }],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
