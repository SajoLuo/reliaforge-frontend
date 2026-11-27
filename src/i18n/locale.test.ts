import { afterEach, describe, expect, it, vi } from "vitest"
import { detectLocale, LOCALE_STORAGE_KEY, localePath, semanticPath } from "@/i18n/locale"

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe("locale detection and routing", () => {
  it("prioritizes ?lang query param and persists it to localStorage", () => {
    expect(detectLocale("?lang=zh")).toBe("zh")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh")
    expect(detectLocale("")).toBe("zh")

    expect(detectLocale("?lang=en")).toBe("en")
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en")
  })

  it("ignores invalid ?lang values and falls back to stored or browser locale", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh")
    expect(detectLocale("?lang=fr")).toBe("zh")

    window.localStorage.clear()
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["zh-CN", "en-US"])
    expect(detectLocale("")).toBe("zh")

    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"])
    expect(detectLocale("")).toBe("en")
  })

  it("normalizes legacy /zh paths into single-prefix paths", () => {
    expect(semanticPath("/zh")).toBe("/")
    expect(semanticPath("/zh/")).toBe("/")
    expect(semanticPath("/zh/plugins/runbook")).toBe("/plugins/runbook")
    expect(semanticPath("/zh-tools")).toBe("/zh-tools")
    expect(localePath("/zh/about")).toBe("/about")
  })
})
