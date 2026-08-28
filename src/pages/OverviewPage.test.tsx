import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlatformStatus, listPlugins } from "@/api/plugins"
import { OverviewPage } from "@/pages/OverviewPage"
import type { PlatformStatusResponse } from "@/types/plugin"

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

  it("renders summary metrics and the empty catalog state", async () => {
    vi.mocked(getPlatformStatus).mockResolvedValue(status)
    vi.mocked(listPlugins).mockResolvedValue({ plugins: [] })
    render(<MemoryRouter><OverviewPage /></MemoryRouter>)

    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Platform summary" })).toHaveTextContent("healthy")
    expect(screen.getByTestId("overview-summary")).toHaveTextContent("Needs attention")
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No plugins discovered")
  })
})
