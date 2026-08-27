import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { App } from "@/App"

afterEach(cleanup)

describe("App", () => {
  it("routes to the neutral project overview", () => {
    render(<MemoryRouter initialEntries={["/about"]}><App /></MemoryRouter>)
    expect(screen.getByRole("heading", { name: "About ReliaForge" })).toBeInTheDocument()
    expect(screen.getByText("Manifest first")).toBeInTheDocument()
    expect(screen.getByText("Sajo Luo", { exact: false })).toBeInTheDocument()
  })
})
