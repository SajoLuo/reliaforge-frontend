import { expect, test } from "@playwright/test"

const plugins = [
  { id: "demo", name: "Demo", version: "1.0.0", description: "Neutral example", api_version: "v1", state: "running", available_actions: [], dependencies: [], capabilities: ["demo.greeting"], settings_schema: { type: "object", properties: { greeting: { type: "string" } } }, frontend: { category: "Examples" }, health: { status: "healthy", details: { service_running: true } } },
  { id: "runbook", name: "Runbook Preview", version: "1.0.0", description: "Read-only preview", api_version: "v1", state: "running", available_actions: ["stop", "restart"], dependencies: [{ id: "demo", version: "^1.0.0" }], capabilities: ["runbook.preview"], settings_schema: { type: "object", properties: { steps: { type: "array", maxItems: 10 } } }, frontend: { category: "Examples" }, health: { status: "healthy", details: { service_running: true } } },
]

test("plugin catalog and generic detail display both manifest-backed plugins", async ({ page }) => {
  await page.route("**/api/v1/status", (route) => route.fulfill({ json: { status: "healthy", version: "0.1.0", plugins: { total: 2, running: 2, degraded: 0, stopped: 0, error: 0 } } }))
  await page.route("**/api/v1/plugins", (route) => route.fulfill({ json: { plugins } }))
  await page.route("**/api/v1/plugins/runbook", (route) => route.fulfill({ json: plugins[1] }))
  await page.goto("/plugins")
  await expect(page.getByTestId("plugin-card")).toHaveCount(2)
  await expect(page.getByTestId("plugin-card").filter({ hasText: "Demo" })).toBeVisible()
  const runbookCard = page.getByTestId("plugin-card").filter({ hasText: "Runbook Preview" })
  await expect(runbookCard).toContainText("runbook.preview")
  await runbookCard.getByRole("link", { name: "Inspect Runbook Preview" }).click()
  await expect(page.getByText("demo", { exact: true })).toBeVisible()
  await expect(page.getByText("^1.0.0", { exact: true })).toBeVisible()
  await expect(page.getByText("runbook.preview", { exact: true })).toBeVisible()
  await expect(page.getByText('"maxItems": 10', { exact: false })).toBeVisible()
})

test("lifecycle controls follow the backend action contract after a transition", async ({ page }) => {
  let current = { ...plugins[1], available_actions: ["stop", "restart"], state: "running" }
  await page.route("**/api/v1/plugins/runbook**", async (route) => {
    if (route.request().method() === "POST") {
      current = { ...current, available_actions: ["start"], state: "stopped" }
    }
    await route.fulfill({ json: current })
  })

  await page.goto("/plugins/runbook")
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Stop" }).click()

  await expect(page.getByRole("button", { name: "Start" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Stop" })).toHaveCount(0)
  await expect(page.getByText("stopped", { exact: true })).toBeVisible()
})
