import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useLocation } from "react-router-dom"
import { AppRouter } from "@/routing/AppRouter"

function LocationProbe() {
  return <p>{useLocation().pathname}</p>
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, "", "/")
  window.location.hash = ""
})

describe("AppRouter", () => {
  it("uses normal browser paths outside the demo build", () => {
    window.history.replaceState({}, "", "/about")
    render(<AppRouter mode="normal"><LocationProbe /></AppRouter>)
    expect(screen.getByText("/about")).toBeInTheDocument()
  })

  it("uses reload-safe hash paths in the demo build", () => {
    window.location.hash = "#/plugins/runbook"
    render(<AppRouter mode="demo"><LocationProbe /></AppRouter>)
    expect(screen.getByText("/plugins/runbook")).toBeInTheDocument()
  })
})
