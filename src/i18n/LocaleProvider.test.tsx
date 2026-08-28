import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { useLocale } from "@/i18n/useLocale"

function LocaleHarness() {
  const location = useLocation()
  const { locale, switchLocale, t } = useLocale()
  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="path">{location.pathname}{location.search}</p>
      <p>{t("overview.title")}</p>
      <button type="button" onClick={() => switchLocale("en")}>English</button>
      <button type="button" onClick={() => switchLocale("zh")}>中文</button>
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
  document.documentElement.lang = "en"
})

describe("LocaleProvider", () => {
  it("uses the URL as the sole locale truth", async () => {
    renderLocale("/plugins?from=shared")

    expect(screen.getByTestId("locale")).toHaveTextContent("en")
    expect(screen.getByTestId("path")).toHaveTextContent("/plugins?from=shared")
    await waitFor(() => expect(document.documentElement.lang).toBe("en"))
  })

  it("preserves the semantic route and query in the switched URL", async () => {
    const user = userEvent.setup()
    renderLocale("/plugins/runbook?tab=contract")

    await user.click(screen.getByRole("button", { name: "中文" }))
    expect(screen.getByTestId("path")).toHaveTextContent("/zh/plugins/runbook?tab=contract")
    expect(screen.getByText("概览")).toBeInTheDocument()
    await waitFor(() => expect(document.documentElement.lang).toBe("zh-CN"))

    await user.click(screen.getByRole("button", { name: "English" }))
    expect(screen.getByTestId("path")).toHaveTextContent("/plugins/runbook?tab=contract")
  })
})
