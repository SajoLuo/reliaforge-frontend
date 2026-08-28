import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("uses the dedicated readable text token for danger actions", () => {
    render(<Button variant="danger">Stop</Button>)

    expect(screen.getByRole("button", { name: "Stop" })).toHaveClass("text-danger-button-ink")
  })
})
