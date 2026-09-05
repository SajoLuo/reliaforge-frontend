import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { App } from "@/App"
import { LocaleProvider } from "@/i18n/LocaleProvider"

afterEach(cleanup)

describe("App", () => {
  it("routes to the neutral project overview", () => {
    render(<MemoryRouter initialEntries={["/about"]}><App /></MemoryRouter>)
    expect(screen.getByRole("heading", { name: "About ReliaForge" })).toBeInTheDocument()
    expect(screen.getByText("Add your service")).toBeInTheDocument()
    expect(screen.getByText("Sajo Luo", { exact: false })).toBeInTheDocument()
  })

  it("renders the complete Chinese route tree", () => {
    render(
      <MemoryRouter initialEntries={["/zh/about"]}>
        <LocaleProvider><App /></LocaleProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole("heading", { name: "关于 ReliaForge" })).toBeInTheDocument()
    expect(screen.getByText("接入自己的服务")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "插件" })).toHaveAttribute("href", "/zh/plugins")
  })
})
