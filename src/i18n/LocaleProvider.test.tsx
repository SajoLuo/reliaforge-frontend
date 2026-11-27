import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LOCALE_STORAGE_KEY } from "@/i18n/locale"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { useLocale } from "@/i18n/useLocale"

function LocaleHarness() {
  const location = useLocation()
  const { locale, pathFor, t } = useLocale()
  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="path">{location.pathname}{location.search}</p>
      <p data-testid="resolved-path">{pathFor("/plugins/runbook")}</p>
      <p>{t("overview.title")}</p>
    </div>
  )
}

function renderLocale(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LocaleProvider><LocaleHarness /></LocaleProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.lang = "en"
  vi.restoreAllMocks()
})

describe("LocaleProvider", () => {
  it("applies ?lang=zh without adding /zh route prefixes", async () => {
    renderLocale("/plugins/runbook?lang=zh")

    expect(screen.getByTestId("locale")).toHaveTextContent("zh")
    expect(screen.getByTestId("resolved-path")).toHaveTextContent("/plugins/runbook")
    expect(screen.getByText("总览")).toBeInTheDocument()
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh")
    await waitFor(() => expect(document.documentElement.lang).toBe("zh-CN"))
    expect(document.title).toBe("ReliaForge · 插件详情")
  })

  it("follows browser navigator.languages when no query or stored override exists", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["zh-TW"])
    renderLocale("/platform")

    expect(screen.getByTestId("locale")).toHaveTextContent("zh")
    await waitFor(() => expect(document.documentElement.lang).toBe("zh-CN"))
    expect(document.title).toBe("ReliaForge · 平台")
  })
})
