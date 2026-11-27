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
  await expect(page.locator("header").getByText("stopped", { exact: true })).toBeVisible()
})

test("dynamic ESM plugins load routes and overview widgets via window.__RELIAFORGE_HOST__", async ({ page }, testInfo) => {
  const esmPlugins = [
    {
      id: "sample_esm",
      name: "Sample ESM",
      version: "1.0.0",
      description: "Runtime ESM plugin",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: ["sample.ui"],
      settings_schema: {},
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [{ label: "Sample Ops", label_zh: "示例运维", path: "", icon: "server", order: 10, section: "workspace" }],
        provides_themes: [],
        entry_url: "/api/v1/plugins/sample_esm/ui/entry.js?v=test01",
        style_url: "/api/v1/plugins/sample_esm/ui/style.css?v=test01",
      },
      health: { status: "healthy", details: null },
    },
  ]

  const sampleBundle = `
    const bridge = window.__RELIAFORGE_HOST__;
    const { createElement, useState } = bridge.modules.react;
    const { Card, CardContent, PageHeader, Button, Sheet, Status } = bridge.modules["@reliaforge/plugin-sdk"];
    function WorkspacePage({ pluginId }) {
      const [open, setOpen] = useState(false);
      return createElement(
        Card,
        null,
        createElement(
          CardContent,
          null,
          createElement(PageHeader, {
            title: "Dynamic ESM Workspace",
            meta: createElement(Status, { value: "healthy" }),
            actions: createElement(Button, { onClick: () => setOpen(true) }, "Inspect Sheet"),
          }),
          createElement(
            Sheet,
            { open, onClose: () => setOpen(false), title: "Plugin Sheet", size: "md" },
            createElement("p", null, "Mounted plugin " + pluginId),
          ),
        ),
      );
    }
    function StatusWidget({ pluginId }) {
      return createElement("p", null, "Widget ready for " + pluginId);
    }
    export default {
      apiVersion: "v1",
      id: "sample_esm",
      routes: [{ path: "", element: WorkspacePage }],
      overviewWidgets: [{ id: "status", title: "Sample Status", span: 2, component: StatusWidget }],
    };
  `

  await page.route("**/api/v1/status", (route) =>
    route.fulfill({ json: { status: "healthy", version: "0.2.0", plugins: { total: 1, running: 1, degraded: 0, stopped: 0, error: 0 } } }),
  )
  await page.route("**/api/v1/plugins", (route) => route.fulfill({ json: { plugins: esmPlugins } }))
  await page.route("**/api/v1/plugins/sample_esm", (route) => route.fulfill({ json: esmPlugins[0] }))
  await page.route("**/api/v1/plugins/sample_esm/ui/entry.js**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: sampleBundle }),
  )
  await page.route("**/api/v1/plugins/sample_esm/ui/style.css**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css; charset=utf-8", body: '[data-rf-plugin="sample_esm"] { border-radius: 0; }' }),
  )

  await page.goto("/")
  await expect(page.getByTestId("overview-plugin-widgets")).toContainText("Widget ready for sample_esm")
  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Open navigation" }).click()
  }

  await page.getByRole("link", { name: "Sample Ops", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Dynamic ESM Workspace" })).toBeVisible()
  await expect(page.locator('[data-rf-plugin="sample_esm"]')).toBeVisible()

  await page.getByRole("button", { name: "Inspect Sheet" }).click()
  await expect(page.getByTestId("sheet")).toContainText("Mounted plugin sample_esm")
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("sheet")).toHaveCount(0)
})

test("mounts infra_overview directly on / and keeps platform overview on /platform", async ({ page }, testInfo) => {
  const infraPlugins = [
    {
      id: "infra_overview",
      name: "Infra Overview",
      version: "1.0.0",
      description: "Infrastructure cockpit",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: ["infra_overview.topology"],
      settings_schema: {},
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [{ label: "Overview", label_zh: "总览", path: "", icon: "layers", order: 10, section: "workspace" }],
        provides_themes: [],
        entry_url: "/api/v1/plugins/infra_overview/ui/entry.js?v=test01",
        style_url: null,
      },
      health: { status: "healthy", details: null },
    },
  ]

  const infraBundle = `
    const { createElement } = window.__RELIAFORGE_HOST__.modules.react;
    const { PageHeader } = window.__RELIAFORGE_HOST__.modules["@reliaforge/plugin-sdk"];
    function CockpitPage() {
      return createElement(PageHeader, { title: "Infra Cockpit" });
    }
    export default {
      apiVersion: "v1",
      id: "infra_overview",
      routes: [{ path: "", element: CockpitPage }],
    };
  `

  await page.route("**/api/v1/status", (route) =>
    route.fulfill({ json: { status: "healthy", version: "0.2.0", plugins: { total: 1, running: 1, degraded: 0, stopped: 0, error: 0 } } }),
  )
  await page.route("**/api/v1/plugins", (route) => route.fulfill({ json: { plugins: infraPlugins } }))
  await page.route("**/api/v1/plugins/infra_overview/ui/entry.js**", (route) =>
    route.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: infraBundle }),
  )

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Infra Cockpit" })).toBeVisible()

  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Open navigation" }).click()
  }
  await page.getByRole("link", { name: "Platform", exact: true }).click()
  await expect(page).toHaveURL(/\/platform$/)
  await expect(page.getByRole("heading", { name: "Platform", exact: true })).toBeVisible()
})
