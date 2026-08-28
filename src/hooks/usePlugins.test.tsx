import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlugin, runPluginAction } from "@/api/plugins"
import { usePlugin } from "@/hooks/usePlugins"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", () => ({
  listPlugins: vi.fn(),
  getPlatformStatus: vi.fn(),
  getPlugin: vi.fn(),
  runPluginAction: vi.fn(),
}))

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((fulfill, fail) => {
    resolve = fulfill
    reject = fail
  })
  return { promise, resolve, reject }
}

function EnglishWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <LocaleProvider>{children}</LocaleProvider>
    </MemoryRouter>
  )
}

function plugin(id: string): PluginView {
  return {
    id,
    name: `Plugin ${id}`,
    version: "1.0.0",
    description: `${id} fixture`,
    api_version: "v1",
    state: "running",
    available_actions: ["stop"],
    dependencies: [],
    capabilities: [`${id}.service`],
    settings_schema: { type: "object" },
    frontend: { category: "Tests" },
    health: { status: "healthy", details: null },
  }
}

afterEach(() => vi.resetAllMocks())

describe("usePlugin", () => {
  it("commits the action response without issuing a redundant detail request", async () => {
    const running = plugin("a")
    const stopped: PluginView = {
      ...running,
      state: "stopped",
      available_actions: ["start"],
      health: { status: "stopped", details: null },
    }
    vi.mocked(getPlugin).mockResolvedValue(running)
    vi.mocked(runPluginAction).mockResolvedValue(stopped)
    const { result } = renderHook(() => usePlugin("a"))
    await waitFor(() => expect(result.current.data?.state).toBe("running"))

    await act(async () => result.current.performAction("stop"))

    expect(result.current.data).toEqual(stopped)
    expect(result.current.actionError).toBeNull()
    expect(getPlugin).toHaveBeenCalledOnce()
  })

  it("does not let an action from the previous route cancel or overwrite the current plugin", async () => {
    const actionA = deferred<PluginView>()
    const loadB = deferred<PluginView>()
    let signalB: AbortSignal | undefined
    vi.mocked(getPlugin).mockImplementation((pluginId, signal) => {
      if (pluginId === "a") return Promise.resolve(plugin("a"))
      signalB = signal
      return loadB.promise
    })
    vi.mocked(runPluginAction).mockReturnValue(actionA.promise)
    const { result, rerender } = renderHook(
      ({ pluginId }) => usePlugin(pluginId),
      { initialProps: { pluginId: "a" } },
    )
    await waitFor(() => expect(result.current.data?.id).toBe("a"))

    let oldAction!: Promise<PluginView | null>
    act(() => {
      oldAction = result.current.performAction("stop")
    })
    rerender({ pluginId: "b" })
    await waitFor(() => expect(getPlugin).toHaveBeenCalledWith("b", expect.any(AbortSignal)))
    actionA.resolve(plugin("a"))
    await act(async () => oldAction)

    expect(signalB?.aborted).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.actionPending).toBeNull()
    expect(result.current.actionError).toBeNull()

    loadB.resolve(plugin("b"))
    await waitFor(() => expect(result.current.data?.id).toBe("b"))
  })

  it("rejects a same-frame duplicate action before React state updates", async () => {
    const action = deferred<PluginView>()
    vi.mocked(getPlugin).mockResolvedValue(plugin("a"))
    vi.mocked(runPluginAction).mockReturnValue(action.promise)
    const { result } = renderHook(() => usePlugin("a"))
    await waitFor(() => expect(result.current.data?.id).toBe("a"))

    let first!: Promise<PluginView | null>
    let duplicate!: Promise<PluginView | null>
    act(() => {
      first = result.current.performAction("stop")
      duplicate = result.current.performAction("stop")
    })
    expect(runPluginAction).toHaveBeenCalledOnce()
    await expect(duplicate).resolves.toBeNull()

    action.resolve(plugin("a"))
    await act(async () => first)
  })

  it("relocalizes a stored action error after the URL locale changes", async () => {
    vi.mocked(getPlugin).mockResolvedValue(plugin("a"))
    vi.mocked(runPluginAction).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: {} },
    })
    const { result } = renderHook(() => ({
      pluginState: usePlugin("a"),
      navigate: useNavigate(),
    }), { wrapper: EnglishWrapper })
    await waitFor(() => expect(result.current.pluginState.data?.id).toBe("a"))

    await act(async () => result.current.pluginState.performAction("stop"))
    expect(result.current.pluginState.actionError).toBe("You do not have permission to perform this action.")

    act(() => result.current.navigate("/zh/"))
    await waitFor(() => expect(result.current.pluginState.actionError).toBe("你没有执行此操作的权限。"))
    expect(runPluginAction).toHaveBeenCalledOnce()
  })

  it("does not restore an abandoned pending action after navigating back", async () => {
    const actionA = deferred<PluginView>()
    vi.mocked(getPlugin).mockImplementation((pluginId) => Promise.resolve(plugin(pluginId)))
    vi.mocked(runPluginAction).mockReturnValue(actionA.promise)
    const { result, rerender, unmount } = renderHook(
      ({ pluginId }) => usePlugin(pluginId),
      { initialProps: { pluginId: "a" } },
    )
    await waitFor(() => expect(result.current.data?.id).toBe("a"))

    let abandonedAction!: Promise<PluginView | null>
    act(() => {
      abandonedAction = result.current.performAction("stop")
    })
    expect(result.current.actionPending).toBe("stop")

    rerender({ pluginId: "b" })
    expect(result.current.actionPending).toBeNull()
    rerender({ pluginId: "a" })
    await waitFor(() => expect(result.current.data?.id).toBe("a"))
    expect(result.current.actionPending).toBeNull()
    expect(result.current.actionError).toBeNull()

    actionA.resolve(plugin("a"))
    await act(async () => abandonedAction)
    expect(result.current.data?.id).toBe("a")
    expect(result.current.actionPending).toBeNull()
    expect(result.current.actionError).toBeNull()
    unmount()
  })
})
