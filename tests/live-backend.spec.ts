import { expect, test } from "@playwright/test"

test("live backend exposes both running plugins through the generic catalog", async ({ page }) => {
  test.skip(process.env.RELIAFORGE_E2E_LIVE !== "1", "Set RELIAFORGE_E2E_LIVE=1 for the cross-repository smoke.")
  await page.goto("/plugins")
  await expect(page.getByTestId("plugin-card")).toHaveCount(2)
  const runbookCard = page.getByTestId("plugin-card").filter({ hasText: "Runbook Preview" })
  await runbookCard.getByRole("link", { name: "Inspect Runbook Preview" }).click()
  await expect(page.getByText("healthy", { exact: true })).toBeVisible()
  await expect(page.getByText("runbook.preview", { exact: true })).toBeVisible()
  await expect(page.getByText("^1.0.0", { exact: true })).toBeVisible()
})

test("live backend executes an authorized lifecycle transition", async ({ page }, testInfo) => {
  test.skip(process.env.RELIAFORGE_E2E_LIVE !== "1", "Set RELIAFORGE_E2E_LIVE=1 for the cross-repository smoke.")
  test.skip(testInfo.project.name !== "chromium", "Run the real mutation once.")

  await page.goto("/plugins/runbook")
  let confirmationSeen = false
  page.once("dialog", async (dialog) => {
    confirmationSeen = true
    expect(dialog.message()).toBe("Restart this plugin?")
    await dialog.accept()
  })
  const restartResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/api/v1/plugins/runbook/restart"),
  )
  await page.getByRole("button", { name: "Restart" }).click()

  const response = await restartResponse
  expect(confirmationSeen).toBe(true)
  expect(response.status()).toBe(200)
  await expect(response.json()).resolves.toMatchObject({ id: "runbook", state: "running" })
  await expect(page.getByText("running", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Restart" })).toBeEnabled()
})
