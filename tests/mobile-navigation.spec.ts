import { expect, test } from "@playwright/test"

test("mobile navigation excludes the closed drawer and restores keyboard focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only navigation contract")
  await page.goto("/about")

  await page.keyboard.press("Tab")
  const openButton = page.locator("button[aria-label='Open navigation']")
  await expect(openButton).toBeFocused()
  await openButton.press("Enter")

  await expect(page.getByRole("button", { name: "Close navigation", exact: true })).toBeFocused()
  await expect(openButton).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByTestId("app-shell-content")).toHaveAttribute("inert", "")
  await page.keyboard.press("Escape")
  await expect(openButton).toBeFocused()
  await expect(openButton).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByTestId("app-shell-content")).not.toHaveAttribute("inert")
})

test("mobile navigation releases modal state when the viewport becomes desktop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile-only navigation contract")
  await page.goto("/about")

  await page.locator("button[aria-label='Open navigation']").click()
  await expect(page.getByTestId("app-shell-content")).toHaveAttribute("inert", "")
  await page.setViewportSize({ width: 1280, height: 800 })

  await expect(page.getByTestId("app-shell-content")).not.toHaveAttribute("inert")
  await expect(page.locator("#mobile-navigation")).not.toHaveAttribute("role", "dialog")
})
