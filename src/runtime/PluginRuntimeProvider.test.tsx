import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { listPlugins } from "@/api/plugins"
import { PluginRuntimeProvider, usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

function esmPlugin(id: string, state: PluginView["state"] = "running"): PluginView {
  return {
    id,
    name: id,
    version: "1.0.0",
    description: `${id} plugin`,
    api_version: "v1",
    state,
    available_actions: [],
    dependencies: [],
    capabilities: [],
    settings_schema: {},
    frontend: {
      category: "Ops",
      ui_mode: "esm",
      nav: [],
      provides_themes: id === "homoshell_theme" ? ["homoshell-pc98"] : [],
      entry_url: `/api/v1/plugins/${id}/ui/entry.js?v=abc123def456`,
      style_url: `/api/v1/plugins/${id}/ui/style.css?v=abc123def456`,
    },
    health: { status: state === "running" ? "healthy" : "stopped", details: null },
  }
}

function Probe() {
  const runtime = usePluginRuntime()
  const theme = useTheme()
  return (
    <div>
      <span data-testid="loaded">{Object.keys(runtime.loadedPlugins).join(",")}</span>
      <span data-testid="widgets">{runtime.widgets.map((w) => w.id).join(",")}</span>
      <span data-testid="themes">{theme.themes.map((t) => t.id).join(",")}</span>
      <span data-testid="errors">{JSON.stringify(runtime.errors)}</span>
      <button type="button" onClick={() => void runtime.refresh()}>Refresh</button>
    </div>
  )
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  document.head.querySelectorAll("link[data-rf-plugin-style]").forEach((node) => node.remove())
})

describe("PluginRuntimeProvider", () => {
  it("loads running ESM plugins, registers widgets/themes, isolates failures, and cleans up on stop", async () => {
    const themePlugin = esmPlugin("homoshell_theme", "running")
    const infraPlugin = esmPlugin("infra_overview", "running")
    const brokenPlugin = esmPlugin("broken", "running")

    vi.mocked(listPlugins)
      .mockResolvedValueOnce({ plugins: [themePlugin, infraPlugin, brokenPlugin] })
      .mockResolvedValueOnce({ plugins: [esmPlugin("homoshell_theme", "stopped"), infraPlugin] })

    const importModule = vi.fn(async (url: string) => {
      if (url.includes("/homoshell_theme/")) {
        return {
          default: {
            apiVersion: "v1",
            id: "homoshell_theme",
            themes: [
              {
                id: "homoshell-pc98",
                label: "HomoShell PC-98",
                cssClass: "theme-homoshell-pc98",
                tokens: { canvas: "4 10 8", accent: "0 255 170" },
              },
            ],
          },
        }
      }
      if (url.includes("/infra_overview/")) {
        return {
          default: {
            apiVersion: "v1",
            id: "infra_overview",
            overviewWidgets: [{ id: "health", title: "Health", order: 1, component: () => <p>ok</p> }],
          },
        }
      }
      throw new Error("Bundle syntax error")
    })

    render(
      <ThemeProvider>
        <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
          <Probe />
        </PluginRuntimeProvider>
      </ThemeProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("homoshell_theme,infra_overview"))
    expect(screen.getByTestId("widgets")).toHaveTextContent("health")
    expect(screen.getByTestId("themes")).toHaveTextContent("reliaforge,homoshell-pc98")
    expect(screen.getByTestId("errors")).toHaveTextContent("Bundle syntax error")
    expect(document.head.querySelector('link[data-rf-plugin-style="homoshell_theme"]')).not.toBeNull()

    await act(async () => {
      screen.getByRole("button", { name: "Refresh" }).click()
    })

    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("infra_overview"))
    expect(screen.getByTestId("themes")).toHaveTextContent("reliaforge")
    expect(screen.getByTestId("themes")).not.toHaveTextContent("homoshell-pc98")
    expect(document.head.querySelector('link[data-rf-plugin-style="homoshell_theme"]')).toBeNull()
  })
})
