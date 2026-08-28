import { expect, test, type Page } from "@playwright/test"

function observeApiRequests(page: Page): string[] {
  const apiRequests: string[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/api/v1")) apiRequests.push(request.url())
  })
  return apiRequests
}

test("read-only demo explores the real console without API traffic or lifecycle controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "demo-chromium", "Desktop demo journey")
  const apiRequests = observeApiRequests(page)

  await page.goto("./#/")
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByTestId("demo-notice")).toContainText("Read-only demo")
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
  await expect(page.getByTestId("plugin-card")).toHaveCount(2)

  await page.getByRole("link", { name: "Plugins", exact: true }).click()
  await expect(page).toHaveURL(/#\/plugins$/)
  const runbookCard = page.getByTestId("plugin-card").filter({ hasText: "Runbook Preview" })
  await runbookCard.getByRole("link", { name: "Inspect Runbook Preview" }).click()

  await expect(page).toHaveURL(/#\/plugins\/runbook$/)
  await expect(page.getByText("demo", { exact: true })).toBeVisible()
  await expect(page.getByText("^1.0.0", { exact: true })).toBeVisible()
  await expect(page.getByText("runbook.preview", { exact: true })).toBeVisible()
  await expect(page.getByText('"maxItems": 10', { exact: false })).toBeVisible()
  await expect(page.getByRole("button", { name: /^(Start|Stop|Restart)$/ })).toHaveCount(0)

  await page.getByRole("button", { name: "Refresh" }).click()
  await expect(page.getByText("healthy", { exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/#\/plugins\/runbook$/)
  await expect(page.getByRole("heading", { name: "Runbook Preview" })).toBeVisible()
  await expect(page.getByTestId("demo-notice")).toBeVisible()
  expect(apiRequests).toEqual([])
})

test("demo switches to a direct Chinese detail route without translating contract identifiers", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "demo-chromium", "Desktop bilingual journey")
  const apiRequests = observeApiRequests(page)

  await page.goto("./#/plugins/runbook?tab=contract")
  await page.getByRole("button", { name: "切换到简体中文" }).click()

  await expect(page).toHaveURL(/#\/zh\/plugins\/runbook\?tab=contract$/)
  await expect(page.getByRole("heading", { name: "运行手册预览" })).toBeVisible()
  await expect(page.getByText("runbook · API v1", { exact: true })).toBeVisible()
  await expect(page.getByText("runbook.preview", { exact: true })).toBeVisible()
  await expect(page.getByText('"maxItems": 10', { exact: false })).toBeVisible()
  await expect(page.getByRole("button", { name: /^(启动|停止|重启)$/ })).toHaveCount(0)
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN")
  await expect(page).toHaveTitle("ReliaForge · 插件详情")
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "ReliaForge 插件运维工作台",
  )
  await expect(page.getByRole("link", { name: "在本地运行以体验生命周期操作" })).toHaveAttribute(
    "href",
    "https://reliaforge.dev/zh/guide/getting-started.html",
  )
  await page.reload()
  await expect(page).toHaveURL(/#\/zh\/plugins\/runbook\?tab=contract$/)
  await expect(page.getByTestId("demo-notice")).toContainText("只读演示")

  await page.getByRole("button", { name: "Switch to English" }).click()
  await expect(page).toHaveURL(/#\/plugins\/runbook\?tab=contract$/)
  await expect(page.getByRole("heading", { name: "Runbook Preview" })).toBeVisible()
  await expect(page).toHaveTitle("ReliaForge · Plugin")
  expect(apiRequests).toEqual([])
})

test.describe("deterministic locale URLs", () => {
  test.use({ locale: "zh-CN" })

  test("does not redirect an English URL from the browser language", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "demo-chromium", "Desktop browser-locale journey")
    const apiRequests = observeApiRequests(page)

    await page.goto("./#/")

    await expect(page).toHaveURL(/#\/$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(page).toHaveTitle("ReliaForge · Overview")
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
    expect(apiRequests).toEqual([])
  })
})

test("read-only demo keeps its notice and navigation usable on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "demo-mobile-chromium", "Mobile demo journey")
  const apiRequests = observeApiRequests(page)

  await page.goto("./#/zh/about")
  await expect(page.getByTestId("demo-notice")).toBeVisible()
  await page.getByRole("button", { name: "打开导航" }).click()
  await expect(page.getByRole("button", { name: "关闭导航" })).toBeFocused()
  await page.getByRole("link", { name: "插件", exact: true }).click()
  await expect(page).toHaveURL(/#\/zh\/plugins$/)
  await expect(page.getByTestId("plugin-card")).toHaveCount(2)
  await expect(page.getByRole("link", { name: "查看 运行手册预览" })).toBeVisible()
  expect(apiRequests).toEqual([])
})
