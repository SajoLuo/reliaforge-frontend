import { describe, expect, it } from "vitest"
import { localeFromPath, localePath, semanticPath } from "@/i18n/locale"

describe("locale routing", () => {
  it("keeps English routes unprefixed and gives Chinese stable equivalent routes", () => {
    expect(localeFromPath("/plugins/runbook")).toBe("en")
    expect(localeFromPath("/zh/plugins/runbook")).toBe("zh")
    expect(localePath("/plugins/runbook", "zh")).toBe("/zh/plugins/runbook")
    expect(localePath("/zh/plugins/runbook", "en")).toBe("/plugins/runbook")
    expect(localePath("/", "zh")).toBe("/zh/")
  })

  it("does not treat unrelated route segments as locales", () => {
    expect(localeFromPath("/zh-tools")).toBe("en")
    expect(semanticPath("/zh-tools")).toBe("/zh-tools")
  })
})
