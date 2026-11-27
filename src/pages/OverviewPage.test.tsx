import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlatformStatus, listPlugins } from "@/api/plugins"
import { OverviewPage } from "@/pages/OverviewPage"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"
import type { PlatformStatusResponse, PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

const status: PlatformStatusResponse = {
  status: "healthy",
  version: "0.1.0",
  plugins: { total: 0, running: 0, degraded: 0, stopped: 0, error: 0 },
}

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe("OverviewPage", () => {
  it("renders the shared loading state", () => {
    vi.mocked(getPlatformStatus).mockReturnValue(new Promise(() => undefined))
    vi.mocked(listPlugins).mockReturnValue(new Promise(() => undefined))
    render(<MemoryRouter><OverviewPage /></MemoryRouter>)
    expect(screen.getByTestId("loading-state")).toBeInTheDocument()
  })

  it("renders a backend error detail", async () => {
    vi.mocked(getPlatformStatus).mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Runtime is unavailable." } },
    })
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [] })
    render(<MemoryRouter><OverviewPage /></MemoryRouter>)
    expect(await screen.findByRole("alert")).toHaveTextContent("Runtime is unavailable.")
  })

  it("renders summary metrics, platform mode title, and the empty catalog state", async () => {
    vi.mocked(getPlatformStatus).mockResolvedValue(status)
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [] })
    const { rerender } = render(<MemoryRouter><OverviewPage /></MemoryRouter>)

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Backend summary" })).toHaveTextContent("Healthy")
    expect(screen.getByTestId("overview-summary")).toHaveTextContent("Needs attention")
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No plugins discovered")

    rerender(<MemoryRouter><OverviewPage mode="platform" /></MemoryRouter>)
    expect(await screen.findByRole("heading", { name: "Platform" })).toBeInTheDocument()
  })

  it("renders plugin overview widgets below the platform summary", async () => {
    const widgetPlugin: PluginView = {
      id: "infra_overview",
      name: "Infra Overview",
      version: "1.0.0",
      description: "Infra",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: [],
      settings_schema: {},
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [],
        provides_themes: [],
        entry_url: "/api/v1/plugins/infra_overview/ui/entry.js?v=1",
        style_url: null,
      },
      health: { status: "healthy", details: null },
    }
    vi.mocked(getPlatformStatus).mockResolvedValue(status)
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [widgetPlugin] })
    const importModule = vi.fn().mockResolvedValue({
      default: {
        apiVersion: "v1",
        id: "infra_overview",
        overviewWidgets: [
          {
            id: "infra-summary",
            title: "Infrastructure Status",
            span: 2,
            component: () => <p>Nodes healthy: 3/3</p>,
          },
        ],
      },
    })

    render(
      <MemoryRouter>
        <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
          <OverviewPage />
        </PluginRuntimeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByTestId("overview-plugin-widgets")).toBeInTheDocument())
    expect(screen.getByText("Infrastructure Status")).toBeInTheDocument()
    expect(screen.getByText("Nodes healthy: 3/3")).toBeInTheDocument()
  })
})
