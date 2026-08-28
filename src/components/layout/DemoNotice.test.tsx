import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { DemoNotice } from "@/components/layout/DemoNotice"

afterEach(cleanup)

describe("DemoNotice", () => {
  it("labels the static deployment and links to the full local experience", () => {
    render(<DemoNotice />)
    expect(screen.getByLabelText("Read-only demo")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Run it locally/ })).toHaveAttribute(
      "href",
      "https://reliaforge.dev/guide/getting-started.html",
    )
  })
})
