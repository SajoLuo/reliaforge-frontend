import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  DEFAULT_THEME_ID,
  ThemeProvider,
  useTheme,
  validateThemeDefinition,
} from "@/theme/ThemeProvider"

function ThemeHarness() {
  const { activeThemeId, themes, setTheme, registerThemes, unregisterPluginThemes, markCatalogSettled } = useTheme()
  return (
    <div>
      <span data-testid="active">{activeThemeId}</span>
      <span data-testid="count">{themes.length}</span>
      <button
        type="button"
        onClick={() =>
          registerThemes("homoshell_theme", [
            {
              id: "homoshell-pc98",
              label: "HomoShell PC-98",
              cssClass: "theme-homoshell-pc98",
              tokens: { canvas: "4 10 8", accent: "0 255 170" },
            },
          ])
        }
      >
        Register
      </button>
      <button type="button" onClick={() => setTheme("homoshell-pc98")}>Activate</button>
      <button type="button" onClick={() => unregisterPluginThemes("homoshell_theme")}>Unregister</button>
      <button type="button" onClick={() => markCatalogSettled(true)}>Settle</button>
    </div>
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  document.documentElement.removeAttribute("data-console-theme")
  document.documentElement.className = ""
  document.documentElement.removeAttribute("style")
})

describe("ThemeProvider", () => {
  it("validates theme definitions strictly", () => {
    expect(
      validateThemeDefinition({
        id: "homoshell-pc98",
        label: "HomoShell",
        cssClass: "theme-homoshell-pc98",
        tokens: { canvas: "4 10 8" },
      }),
    ).not.toBeNull()

    expect(
      validateThemeDefinition({
        id: "reliaforge",
        label: "Override",
        cssClass: "theme-override",
        tokens: {},
      }),
    ).toBeNull()

    expect(
      validateThemeDefinition({
        id: "bad_theme",
        label: "Bad",
        cssClass: "theme-bad",
        tokens: {},
      }),
    ).toBeNull()

    expect(
      validateThemeDefinition({
        id: "bad-value",
        label: "Bad",
        cssClass: "theme-bad",
        tokens: { canvas: "256 0 0" },
      }),
    ).toBeNull()

    expect(
      validateThemeDefinition({
        id: "bad-key",
        label: "Bad",
        cssClass: "theme-bad",
        tokens: { ["unknown-token" as "canvas"]: "1 2 3" },
      }),
    ).toBeNull()
  })

  it("applies validated tokens, persists in localStorage, and falls back to reliaforge on unload", () => {
    window.localStorage.setItem("reliaforge.console.theme", "homoshell-pc98")
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    )

    // Before theme plugin registers, active falls back to reliaforge without clearing stored preference.
    expect(screen.getByTestId("active")).toHaveTextContent(DEFAULT_THEME_ID)
    expect(document.documentElement).toHaveAttribute("data-console-theme", DEFAULT_THEME_ID)

    act(() => screen.getByRole("button", { name: "Register" }).click())
    expect(screen.getByTestId("count")).toHaveTextContent("2")
    expect(screen.getByTestId("active")).toHaveTextContent("homoshell-pc98")
    expect(document.documentElement).toHaveAttribute("data-console-theme", "homoshell-pc98")
    expect(document.documentElement).toHaveClass("theme-homoshell-pc98")
    expect(document.documentElement.style.getPropertyValue("--canvas")).toBe("4 10 8")

    act(() => screen.getByRole("button", { name: "Unregister" }).click())
    expect(screen.getByTestId("active")).toHaveTextContent(DEFAULT_THEME_ID)
    expect(document.documentElement).toHaveAttribute("data-console-theme", DEFAULT_THEME_ID)
    expect(document.documentElement).not.toHaveClass("theme-homoshell-pc98")
    expect(document.documentElement.style.getPropertyValue("--canvas")).toBe("")
    expect(window.localStorage.getItem("reliaforge.console.theme")).toBeNull()
  })

  it("clears stale persisted theme once catalog settles without that theme", () => {
    window.localStorage.setItem("reliaforge.console.theme", "missing-theme")
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    )

    act(() => screen.getByRole("button", { name: "Settle" }).click())
    expect(screen.getByTestId("active")).toHaveTextContent(DEFAULT_THEME_ID)
    expect(window.localStorage.getItem("reliaforge.console.theme")).toBeNull()
  })
})
