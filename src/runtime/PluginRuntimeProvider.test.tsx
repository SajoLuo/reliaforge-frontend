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
      <span data-testid="catalog-error">{runtime.catalogError ?? ""}</span>
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

  it("retries failed plugins with cache-busting query param, reloads style changes, and surfaces catalogError", async () => {
    const first = esmPlugin("proxmox", "running")
    const updatedStyle: PluginView = {
      ...first,
      frontend: { ...first.frontend, style_url: "/api/v1/plugins/proxmox/ui/style.css?v=updated" },
    }
    const upgradedBroken: PluginView = {
      ...updatedStyle,
      frontend: { ...updatedStyle.frontend, entry_url: "/api/v1/plugins/proxmox/ui/entry.js?v=broken2" },
    }

    vi.mocked(listPlugins)
      .mockResolvedValueOnce({ plugins: [first] })
      .mockResolvedValueOnce({ plugins: [first] })
      .mockResolvedValueOnce({ plugins: [updatedStyle] })
      .mockResolvedValueOnce({ plugins: [upgradedBroken] })
      .mockRejectedValueOnce(new Error("Backend unreachable"))

    const importModule = vi.fn()
      .mockRejectedValueOnce(new Error("Temporary 503"))
      .mockResolvedValueOnce({ default: { apiVersion: "v1", id: "proxmox", routes: [] } })
      .mockResolvedValueOnce({ default: { apiVersion: "v1", id: "proxmox", routes: [] } })
      .mockRejectedValueOnce(new Error("Broken v2"))

    render(
      <ThemeProvider>
        <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
          <Probe />
        </PluginRuntimeProvider>
      </ThemeProvider>,
    )

    await waitFor(() => expect(screen.getByTestId("errors")).toHaveTextContent("Temporary 503"))

    await act(async () => {
      screen.getByRole("button", { name: "Refresh" }).click()
    })
    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("proxmox"))
    expect(importModule).toHaveBeenNthCalledWith(
      2,
      "https://ops.example.com/api/v1/plugins/proxmox/ui/entry.js?v=abc123def456&retry=1",
    )

    await act(async () => {
      screen.getByRole("button", { name: "Refresh" }).click()
    })
    await waitFor(() =>
      expect(document.head.querySelector<HTMLLinkElement>('link[data-rf-plugin-style="proxmox"]')?.href)
        .toBe("https://ops.example.com/api/v1/plugins/proxmox/ui/style.css?v=updated"),
    )

    await act(async () => {
      screen.getByRole("button", { name: "Refresh" }).click()
    })
    await waitFor(() => expect(screen.getByTestId("errors")).toHaveTextContent("Broken v2"))
    expect(screen.getByTestId("loaded")).toHaveTextContent("")

    await act(async () => {
      screen.getByRole("button", { name: "Refresh" }).click()
    })
    await waitFor(() => expect(screen.getByTestId("catalog-error")).toHaveTextContent("Backend unreachable"))
  })
})
