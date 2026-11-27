import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PluginErrorBoundary } from "@/components/plugins/PluginErrorBoundary"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function ThrowingPlugin(): never {
  throw new Error("Plugin render crash")
}

describe("PluginErrorBoundary", () => {
  it("isolates a crashing plugin without crashing the host tree", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    render(
      <div>
        <span>Host intact</span>
        <PluginErrorBoundary pluginId="broken_ui">
          <ThrowingPlugin />
        </PluginErrorBoundary>
      </div>,
    )

    expect(screen.getByText("Host intact")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("broken_ui")
  })
})
