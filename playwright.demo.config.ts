import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  testMatch: "demo.spec.ts",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:5531/",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "demo-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "demo-mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run build:demo && npm run preview:demo -- --port 5531",
    url: "http://127.0.0.1:5531/",
    reuseExistingServer: false,
  },
})
