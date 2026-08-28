import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { listPlugins } from "@/api/plugins"
import { PluginsPage } from "@/pages/PluginsPage"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe("PluginsPage", () => {
  it("renders a loading state while discovery is pending", () => {
    vi.mocked(listPlugins).mockReturnValue(new Promise(() => undefined))
    render(<MemoryRouter><PluginsPage /></MemoryRouter>)
    expect(screen.getByTestId("loading-state")).toBeInTheDocument()
  })

  it("renders the empty state when no plugins are discovered", async () => {
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [] })
    render(<MemoryRouter><PluginsPage /></MemoryRouter>)
    expect(await screen.findByTestId("empty-state")).toBeInTheDocument()
  })

  it("renders an error state when discovery fails", async () => {
    vi.mocked(listPlugins).mockRejectedValue(new Error("Catalog unavailable"))
    render(<MemoryRouter><PluginsPage /></MemoryRouter>)
    expect(await screen.findByTestId("error-state")).toHaveTextContent("Catalog unavailable")
  })

  it("renders demo and runbook from the API without a static route registry", async () => {
    const demo: PluginView = {
      id: "demo",
      name: "Demo",
      version: "1.0.0",
      description: "Neutral greeting",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: ["demo.greeting"],
      settings_schema: {},
      frontend: { category: "Examples" },
      health: { status: "healthy", details: null },
    }
    const runbook: PluginView = {
      ...demo,
      id: "runbook",
      name: "Runbook Preview",
      description: "Read-only preview",
      dependencies: [{ id: "demo", version: "^1.0.0" }],
      capabilities: ["runbook.preview"],
      available_actions: ["stop", "restart"],
    }
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [demo, runbook] })
    render(<MemoryRouter><PluginsPage /></MemoryRouter>)

    expect(await screen.findByText("Demo")).toBeInTheDocument()
    expect(screen.getByText("Runbook Preview")).toBeInTheDocument()
    expect(screen.getByText("runbook.preview")).toBeInTheDocument()
    expect(screen.getByTestId("plugin-list")).toHaveTextContent("Status")
    const links = screen.getAllByRole("link", { name: /^Inspect / })
    expect(links[0]).toHaveAttribute("href", "/plugins/demo")
    expect(links[1]).toHaveAttribute("href", "/plugins/runbook")
  })
})
