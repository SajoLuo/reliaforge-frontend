import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getPlugin, runPluginAction } from "@/api/plugins"
import { PluginDetailPage } from "@/pages/PluginDetailPage"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

const plugin: PluginView = {
  id: "runbook",
  name: "Runbook Preview",
  version: "1.0.0",
  description: "Read-only preview",
  api_version: "v1",
  state: "running",
  available_actions: ["stop", "restart"],
  dependencies: [{ id: "demo", version: "^1.0.0" }],
  capabilities: ["runbook.preview"],
  settings_schema: { type: "object", maxItems: 10 },
  frontend: { category: "Examples" },
  health: { status: "healthy", details: null },
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/plugins/runbook"]}>
      <Routes><Route path="/plugins/:pluginId" element={<PluginDetailPage />} /></Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true)
})

describe("PluginDetailPage", () => {
  it("renders only lifecycle actions authorized by the backend", async () => {
    vi.mocked(getPlugin).mockResolvedValue(plugin)
    renderDetail()

    expect(await screen.findByRole("button", { name: "Stop" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument()
  })

  it("does not invent actions for an error record", async () => {
    vi.mocked(getPlugin).mockResolvedValue({
      ...plugin,
      state: "error",
      available_actions: [],
      health: { status: "error", details: null },
    })
    renderDetail()

    expect(await screen.findByText("Runbook Preview")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Start|Stop|Restart/ })).not.toBeInTheDocument()
  })

  it("shows the backend reason when a lifecycle action is rejected", async () => {
    let finishRefresh!: (value: PluginView) => void
    const refresh = new Promise<PluginView>((resolve) => {
      finishRefresh = resolve
    })
    vi.mocked(getPlugin)
      .mockResolvedValueOnce(plugin)
      .mockReturnValueOnce(refresh)
    vi.mocked(runPluginAction).mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Active dependents prevent stop." } },
    })
    renderDetail()

    await userEvent.click(await screen.findByRole("button", { name: "Stop" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Active dependents prevent stop.")

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }))
    expect(screen.getByRole("button", { name: "Refresh" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled()

    finishRefresh(plugin)
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled()
    expect(getPlugin).toHaveBeenCalledTimes(2)
  })

  it("does not refresh or update action state after unmount", async () => {
    let finishAction!: (value: PluginView) => void
    const action = new Promise<PluginView>((resolve) => {
      finishAction = resolve
    })
    vi.mocked(getPlugin).mockResolvedValue(plugin)
    vi.mocked(runPluginAction).mockReturnValue(action)
    const view = renderDetail()
    await userEvent.click(await screen.findByRole("button", { name: "Restart" }))
    expect(runPluginAction).toHaveBeenCalledOnce()

    view.unmount()
    finishAction(plugin)
    await action

    expect(getPlugin).toHaveBeenCalledOnce()
  })

  it("does not dispatch a destructive action when confirmation is declined", async () => {
    vi.mocked(getPlugin).mockResolvedValue(plugin)
    vi.mocked(window.confirm).mockReturnValue(false)
    renderDetail()

    await userEvent.click(await screen.findByRole("button", { name: "Stop" }))

    expect(runPluginAction).not.toHaveBeenCalled()
  })
})
