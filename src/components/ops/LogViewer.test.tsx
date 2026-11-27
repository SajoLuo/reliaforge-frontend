import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LogViewer } from "@/components/ops/LogViewer"

class MockEventSource {
  static instances: MockEventSource[] = []
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onerror: (() => void) | null = null
  onopen: (() => void) | null = null
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>()
  closed = false

  constructor(public url: string) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, cb: (event: MessageEvent<string>) => void) {
    const existing = this.listeners.get(type) ?? []
    this.listeners.set(type, [...existing, cb])
  }

  removeEventListener(type: string, cb: (event: MessageEvent<string>) => void) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((candidate) => candidate !== cb),
    )
  }

  emit(type: string, data: string) {
    const event = { data } as MessageEvent<string>
    if (type === "message") this.onmessage?.(event)
    for (const cb of this.listeners.get(type) ?? []) cb(event)
  }

  close() {
    this.closed = true
  }
}

afterEach(() => {
  cleanup()
  MockEventSource.instances = []
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("LogViewer", () => {
  it("streams SSE lines with ring cap, filters by keyword, toggles timestamps & wrap, copies, and downloads", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("EventSource", MockEventSource)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-logs")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)

    const { unmount } = render(
      <LogViewer
        title="Pod logs"
        streamUrl="/api/v1/plugins/kubernetes/pods/default/web/logs/stream"
        maxLines={3}
        lines={[{ timestamp: "12:00:00Z", level: "info", message: "boot" }]}
      />,
    )

    const source = MockEventSource.instances[0]
    expect(source.url).toBe("/api/v1/plugins/kubernetes/pods/default/web/logs/stream")

    act(() => {
      source.emit("log", JSON.stringify({ line: "listening on 8080" }))
      source.emit("message", JSON.stringify({ timestamp: "12:00:01Z", message: "warn check" }))
      source.emit("message", "plain line")
    })

    // maxLines=3 caps lines to last 3 ("listening on 8080", "warn check", "plain line")
    expect(screen.queryByText("boot")).not.toBeInTheDocument()
    expect(screen.getByText("listening on 8080")).toBeInTheDocument()
    expect(screen.getByText("plain line")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Wrap" }))
    expect(screen.getByRole("button", { name: "Wrap" })).toHaveAttribute("aria-pressed", "false")

    await user.click(screen.getByRole("button", { name: "Timestamps" }))
    expect(screen.queryByText("12:00:01Z")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Pause" }))
    expect(screen.getByText("Paused")).toBeInTheDocument()

    act(() => {
      source.emit("message", "after pause line")
    })
    expect(screen.queryByText("after pause line")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Resume" }))
    expect(screen.getByText("after pause line")).toBeInTheDocument()

    await user.type(screen.getByRole("searchbox"), "warn")
    expect(screen.getByText("warn check")).toBeInTheDocument()
    expect(screen.queryByText("plain line")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(writeText).toHaveBeenCalledWith("warn check")

    await user.click(screen.getByRole("button", { name: "Download" }))
    expect(createObjectURL).toHaveBeenCalledOnce()

    unmount()
    expect(source.closed).toBe(true)
  })

  it("highlights log levels, deduplicates consecutive and inline timestamps, and disables copy when clipboard is absent", () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    render(
      <LogViewer
        maxLines={3}
        lines={[
          { id: "1", timestamp: "12:00:00Z", level: "ERROR", message: "12:00:00Z connection failed" },
          { id: "2", timestamp: "12:00:00Z", level: "WARN", message: "retrying socket" },
          { id: "3", timestamp: "12:00:02Z", level: "INFO", message: "recovered" },
        ]}
      />,
    )

    expect(screen.getByText("connection failed")).toHaveClass("text-danger-ink")
    expect(screen.getByText("[WARN]")).toHaveClass("text-warning-ink")
    expect(screen.getByText("[INFO]")).toHaveClass("text-info-ink")
    const repeatedTimestamps = screen.getAllByText("12:00:00Z")
    expect(repeatedTimestamps[0]).not.toHaveClass("opacity-0")
    expect(repeatedTimestamps[1]).toHaveClass("opacity-0")
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled()
  })
})
