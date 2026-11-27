import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlugin, listPlugins } from "@/api/plugins"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { PluginWorkspacePage } from "@/pages/PluginWorkspacePage"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"
import { ThemeProvider } from "@/theme/ThemeProvider"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

const proxmoxPlugin: PluginView = {
  id: "proxmox",
  name: "Proxmox VE",
  version: "1.0.0",
  description: "Proxmox host overview",
  api_version: "v1",
  state: "running",
  available_actions: [],
  dependencies: [],
  capabilities: ["proxmox.inventory"],
  settings_schema: {},
  frontend: {
    category: "Infrastructure",
    ui_mode: "esm",
    nav: [{ label: "Proxmox", label_zh: "Proxmox", path: "", icon: "server", order: 20, section: "workspace" }],
    provides_themes: [],
    entry_url: "/api/v1/plugins/proxmox/ui/entry.js?v=1234567890ab",
    style_url: null,
  },
  health: { status: "healthy", details: null },
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe("PluginWorkspacePage", () => {
  it("renders dynamic ESM plugin routes inside data-rf-plugin wrapper", async () => {
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [proxmoxPlugin] })
    vi.mocked(getPlugin).mockResolvedValue(proxmoxPlugin)
    const importModule = vi.fn().mockResolvedValue({
      default: {
        apiVersion: "v1",
        id: "proxmox",
        routes: [
          {
            path: "",
            element: ({ pluginId }: { pluginId: string }) => <h1>Workspace for {pluginId}</h1>,
          },
          {
            path: "/nodes",
            element: () => <h2>Nodes subroute</h2>,
          },
        ],
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={["/zh/p/proxmox/nodes"]}>
        <LocaleProvider>
          <ThemeProvider>
            <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
              <Routes>
                <Route path="/zh/p/:pluginId/*" element={<PluginWorkspacePage />} />
              </Routes>
            </PluginRuntimeProvider>
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole("heading", { name: "Nodes subroute" })).toBeInTheDocument())
    expect(container.querySelector('[data-rf-plugin="proxmox"]')).not.toBeNull()
  })

  it("renders an actionable notice when the plugin is stopped", async () => {
    const stopped = { ...proxmoxPlugin, state: "stopped" as const }
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [stopped] })
    vi.mocked(getPlugin).mockResolvedValue(stopped)

    render(
      <MemoryRouter initialEntries={["/p/proxmox"]}>
        <LocaleProvider>
          <ThemeProvider>
            <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={vi.fn()}>
              <Routes>
                <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
              </Routes>
            </PluginRuntimeProvider>
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Plugin is not running")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Inspect plugin details" })).toHaveAttribute("href", "/plugins/proxmox")
  })

  it("renders a clear notice when a running ESM plugin exports no routes and surfaces catalogError", async () => {
    const themeOnly: PluginView = {
      ...proxmoxPlugin,
      id: "homoshell_theme",
      name: "HomoShell Theme",
      frontend: { ...proxmoxPlugin.frontend, nav: [], entry_url: "/api/v1/plugins/homoshell_theme/ui/entry.js?v=1" },
    }
    vi.mocked(listPlugins).mockResolvedValueOnce({ plugins: [themeOnly] })
    vi.mocked(getPlugin).mockResolvedValueOnce(themeOnly)
    const importModule = vi.fn().mockResolvedValue({
      default: { apiVersion: "v1", id: "homoshell_theme", themes: [] },
    })

    const view = render(
      <MemoryRouter initialEntries={["/p/homoshell_theme"]}>
        <LocaleProvider>
          <ThemeProvider>
            <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
              <Routes>
                <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
              </Routes>
            </PluginRuntimeProvider>
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Plugin workspace unavailable")).toBeInTheDocument()
    view.unmount()

    vi.mocked(listPlugins).mockRejectedValueOnce(new Error("Catalog read failed"))
    vi.mocked(getPlugin).mockResolvedValueOnce(proxmoxPlugin)
    render(
      <MemoryRouter initialEntries={["/p/proxmox"]}>
        <LocaleProvider>
          <ThemeProvider>
            <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={vi.fn()}>
              <Routes>
                <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
              </Routes>
            </PluginRuntimeProvider>
          </ThemeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Could not load plugin workspace")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Catalog read failed")
  })
})
