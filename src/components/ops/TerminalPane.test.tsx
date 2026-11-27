import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mockTerminalState = {
  writes: [] as Array<string | Uint8Array>,
  dataHandler: null as ((data: string) => void) | null,
  binaryHandler: null as ((data: string) => void) | null,
  resizeHandler: null as ((size: { cols: number; rows: number }) => void) | null,
  disposed: false,
}

vi.mock("@xterm/xterm/css/xterm.css", () => ({}))
vi.mock("@xterm/xterm", () => ({
  Terminal: vi.fn(function (this: Record<string, unknown>) {
    this.cols = 100
    this.rows = 30
    this.loadAddon = vi.fn()
    this.open = vi.fn()
    this.write = vi.fn((chunk: string | Uint8Array) => {
      mockTerminalState.writes.push(chunk)
    })
    this.onData = vi.fn((cb: (data: string) => void) => {
      mockTerminalState.dataHandler = cb
      return { dispose: vi.fn() }
    })
    this.onBinary = vi.fn((cb: (data: string) => void) => {
      mockTerminalState.binaryHandler = cb
      return { dispose: vi.fn() }
    })
    this.onResize = vi.fn((cb: (size: { cols: number; rows: number }) => void) => {
      mockTerminalState.resizeHandler = cb
      return { dispose: vi.fn() }
    })
    this.dispose = vi.fn(() => {
      mockTerminalState.disposed = true
    })
  }),
}))
vi.mock("@xterm/addon-fit", () => ({
  FitAddon: vi.fn(function (this: Record<string, unknown>) {
    this.fit = vi.fn()
  }),
}))
vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: vi.fn(function () {
    return {}
  }),
}))

import { TerminalPane } from "@/components/ops/TerminalPane"

class MockWebSocket {
  static OPEN = 1
  static instances: MockWebSocket[] = []
  readyState = MockWebSocket.OPEN
  binaryType = ""
  sent: Array<string | Uint8Array> = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  closed = false

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  send(data: string | Uint8Array) {
    this.sent.push(data)
  }

  close() {
    this.closed = true
  }
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  MockWebSocket.instances = []
  mockTerminalState.writes = []
  mockTerminalState.dataHandler = null
  mockTerminalState.binaryHandler = null
  mockTerminalState.resizeHandler = null
  mockTerminalState.disposed = false
})

describe("TerminalPane", () => {
  it("streams binary Uint8Array chunks directly and exchanges resize/ping/exit JSON control frames", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("WebSocket", MockWebSocket)
    const onExit = vi.fn()
    const connection = { wsUrl: "/plugins/kubernetes/ws/pods/default/web/exec", onExit }

    const { rerender, unmount } = render(
      <TerminalPane title="Pod Shell" connection={connection} />,
    )

    // Allow React.lazy TerminalPaneImpl import to resolve under fake timers.
    await act(async () => {
      await vi.dynamicImportSettled()
    })

    expect(screen.getByText("Pod Shell")).toBeInTheDocument()
    const socket = MockWebSocket.instances[0]
    expect(socket.url).toMatch(/^wss?:\/\/.*\/api\/v1\/plugins\/kubernetes\/ws\/pods\/default\/web\/exec$/)
    expect(socket.binaryType).toBe("arraybuffer")

    // Re-rendering with a new inline object sharing the same wsUrl keeps the existing socket open
    // while updating callbacks to the latest render.
    const latestOnExit = vi.fn()
    rerender(
      <TerminalPane title="Pod Shell" connection={{ wsUrl: connection.wsUrl, onExit: latestOnExit }} />,
    )
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(socket.closed).toBe(false)

    act(() => socket.onopen?.())
    expect(screen.getByText("Connected")).toBeInTheDocument()
    expect(socket.sent[0]).toBe(JSON.stringify({ type: "resize", cols: 100, rows: 30 }))

    // Binary ArrayBuffer chunk (e.g. split multi-byte UTF-8) passes raw Uint8Array to xterm.write
    const rawBytes = new Uint8Array([0xe4, 0xb8, 0xad]).buffer
    act(() => socket.onmessage?.({ data: rawBytes }))
    expect(mockTerminalState.writes[0]).toBeInstanceOf(Uint8Array)
    expect(Array.from(mockTerminalState.writes[0] as Uint8Array)).toEqual([0xe4, 0xb8, 0xad])

    act(() => mockTerminalState.dataHandler?.("ls\n"))
    expect(socket.sent[1]).toBeInstanceOf(Uint8Array)

    act(() => vi.advanceTimersByTime(30_000))
    expect(socket.sent).toContain(JSON.stringify({ type: "ping" }))

    act(() => socket.onmessage?.({ data: JSON.stringify({ type: "exit", code: 0 }) }))
    expect(onExit).not.toHaveBeenCalled()
    expect(latestOnExit).toHaveBeenCalledWith(0)
    expect(screen.getByText("Exited (0)")).toBeInTheDocument()

    unmount()
    expect(socket.closed).toBe(true)
    expect(mockTerminalState.disposed).toBe(true)
  })
})
