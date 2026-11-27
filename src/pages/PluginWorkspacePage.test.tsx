import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlatformStatus, getPlugin, listPlugins } from "@/api/plugins"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { HomePage, PluginWorkspacePage } from "@/pages/PluginWorkspacePage"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"
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

const infraOverviewPlugin: PluginView = {
  ...proxmoxPlugin,
  id: "infra_overview",
  name: "Infra Overview",
  frontend: {
    ...proxmoxPlugin.frontend,
    nav: [{ label: "Overview", label_zh: "总览", path: "", icon: "layers", order: 10, section: "workspace" }],
    entry_url: "/api/v1/plugins/infra_overview/ui/entry.js?v=1234567890ab",
  },
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  window.localStorage.clear()
})

describe("PluginWorkspacePage and HomePage", () => {
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
      <MemoryRouter initialEntries={["/p/proxmox/nodes?lang=zh"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
            <Routes>
              <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
            </Routes>
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole("heading", { name: "Nodes subroute" })).toBeInTheDocument())
    expect(container.querySelector('[data-rf-plugin="proxmox"]')).not.toBeNull()
  })

  it("renders infra_overview directly on / when active, and falls back to OverviewPage when absent", async () => {
    vi.mocked(listPlugins).mockResolvedValueOnce({ plugins: [infraOverviewPlugin] })
    const importModule = vi.fn().mockResolvedValueOnce({
      default: {
        apiVersion: "v1",
        id: "infra_overview",
        routes: [{ path: "", element: () => <h1>Infrastructure Cockpit</h1> }],
      },
    })

    const view = render(
      <MemoryRouter initialEntries={["/"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
            <HomePage />
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole("heading", { name: "Infrastructure Cockpit" })).toBeInTheDocument())
    view.unmount()

    vi.mocked(listPlugins).mockResolvedValue({ plugins: [proxmoxPlugin] })
    vi.mocked(getPlatformStatus).mockResolvedValue({
      status: "healthy",
      version: "0.1.0",
      plugins: { total: 1, running: 1, degraded: 0, stopped: 0, error: 0 },
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={vi.fn().mockResolvedValue({ default: { apiVersion: "v1", id: "proxmox", routes: [] } })}>
            <HomePage />
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument())
  })

  it("renders an actionable notice when the plugin is stopped", async () => {
    const stopped = { ...proxmoxPlugin, state: "stopped" as const }
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [stopped] })
    vi.mocked(getPlugin).mockResolvedValue(stopped)

    render(
      <MemoryRouter initialEntries={["/p/proxmox"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={vi.fn()}>
            <Routes>
              <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
            </Routes>
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Plugin is not running")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Inspect plugin details" })).toHaveAttribute("href", "/plugins/proxmox")
  })

  it("renders a clear notice when a running ESM plugin exports no routes and surfaces catalogError", async () => {
    const routeLess: PluginView = {
      ...proxmoxPlugin,
      id: "widget_only",
      name: "Widget Only",
      frontend: { ...proxmoxPlugin.frontend, nav: [], entry_url: "/api/v1/plugins/widget_only/ui/entry.js?v=1" },
    }
    vi.mocked(listPlugins).mockResolvedValueOnce({ plugins: [routeLess] })
    vi.mocked(getPlugin).mockResolvedValueOnce(routeLess)
    const importModule = vi.fn().mockResolvedValue({
      default: { apiVersion: "v1", id: "widget_only", routes: [] },
    })

    const view = render(
      <MemoryRouter initialEntries={["/p/widget_only"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
            <Routes>
              <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
            </Routes>
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Workspace unavailable")).toBeInTheDocument()
    view.unmount()

    vi.mocked(listPlugins).mockRejectedValueOnce(new Error("Catalog read failed"))
    vi.mocked(getPlugin).mockResolvedValueOnce(proxmoxPlugin)
    render(
      <MemoryRouter initialEntries={["/p/proxmox"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={vi.fn()}>
            <Routes>
              <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
            </Routes>
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText("Could not load workspace")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Catalog read failed")
  })
})
