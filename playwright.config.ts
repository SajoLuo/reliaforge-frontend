import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:5530",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: process.env.CI ? "npm run build && npm run preview -- --port 5530" : "npm run dev",
    url: "http://127.0.0.1:5530",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_RELIAFORGE_API_URL: process.env.RELIAFORGE_E2E_API_URL || "http://127.0.0.1:5530",
    },
  },
})
