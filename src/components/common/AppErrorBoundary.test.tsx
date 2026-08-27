import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AppErrorBoundary } from "@/components/common/AppErrorBoundary"

function BrokenView(): never {
  throw new Error("render fixture")
}

afterEach(() => vi.restoreAllMocks())

describe("AppErrorBoundary", () => {
  it("renders a stable fallback when a child throws", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
    render(<AppErrorBoundary><BrokenView /></AppErrorBoundary>)

    expect(screen.getByRole("alert")).toHaveTextContent("ReliaForge could not render this response")
    expect(consoleError).toHaveBeenCalledWith("ReliaForge render failure", expect.any(Error))
  })
})
