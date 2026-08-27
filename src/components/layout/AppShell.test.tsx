import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { AppShell } from "@/components/layout/AppShell"

afterEach(cleanup)

describe("AppShell mobile navigation", () => {
  it("does not trap keyboard focus while the sidebar is not modal", () => {
    const { container } = render(
      <MemoryRouter><AppShell><p>Content</p></AppShell></MemoryRouter>,
    )
    const first = container.querySelector<HTMLElement>("aside a[href]")
    first?.focus()
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })

    first?.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(first).toHaveFocus()
  })

  it("keeps the closed drawer out of focus flow and restores focus after Escape", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter><AppShell><p>Content</p></AppShell></MemoryRouter>,
    )
    const drawer = container.querySelector("aside")
    const openButton = screen.getByRole("button", { name: "Open navigation" })

    expect(drawer).toHaveClass("invisible")
    expect(openButton).toHaveAttribute("aria-expanded", "false")
    await user.click(openButton)
    const closeButton = screen.getByRole("button", { name: "Close navigation" })
    await waitFor(() => expect(closeButton).toHaveFocus())
    expect(drawer).toHaveClass("visible")
    expect(drawer).toHaveAttribute("role", "dialog")
    expect(drawer).toHaveAttribute("aria-modal", "true")
    expect(openButton).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByTestId("app-shell-content")).toHaveAttribute("inert")

    const focusable = drawer?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
    )
    const first = focusable?.[0]
    const last = focusable?.[focusable.length - 1]
    last?.focus()
    await user.tab()
    expect(first).toHaveFocus()
    await user.tab({ shift: true })
    expect(last).toHaveFocus()

    await user.keyboard("{Escape}")
    await waitFor(() => expect(openButton).toHaveFocus())
    expect(drawer).toHaveClass("invisible")
    expect(screen.getByTestId("app-shell-content")).not.toHaveAttribute("inert")
  })

  it("releases the modal and keeps focus in visible navigation after a desktop resize", async () => {
    const originalWidth = window.innerWidth
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 })
    try {
      const user = userEvent.setup()
      const { container } = render(
        <MemoryRouter><AppShell><p>Content</p></AppShell></MemoryRouter>,
      )
      await user.click(screen.getByRole("button", { name: "Open navigation" }))
      const firstLink = container.querySelector<HTMLElement>("aside a[href]")

      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 })
      fireEvent(window, new Event("resize"))

      await waitFor(() => expect(firstLink).toHaveFocus())
      expect(container.querySelector("aside")).not.toHaveAttribute("role")
      expect(screen.getByTestId("app-shell-content")).not.toHaveAttribute("inert")
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth })
    }
  })
})
