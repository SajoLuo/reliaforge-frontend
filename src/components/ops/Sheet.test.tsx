import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ConfirmActionDialog } from "@/components/ops/ConfirmActionDialog"
import { Sheet } from "@/components/ops/Sheet"

afterEach(() => {
  cleanup()
  document.body.style.overflow = ""
})

describe("Sheet", () => {
  it("renders into document.body portal, applies size classes, restores focus, and closes on Esc or backdrop", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const opener = document.createElement("button")
    opener.textContent = "Open"
    document.body.appendChild(opener)
    opener.focus()

    const { rerender } = render(
      <Sheet open onClose={onClose} title="Pod Logs" meta={<span>default/web</span>} size="xl">
        <button type="button">Inside action</button>
      </Sheet>,
    )

    const sheet = screen.getByTestId("sheet")
    expect(sheet.parentElement?.parentElement).toBe(document.body)
    expect(sheet).toHaveClass("max-w-[960px]")
    expect(document.body.style.overflow).toBe("hidden")
    expect(screen.getByRole("button", { name: "Inside action" })).toHaveFocus()

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(sheet.parentElement!)
    expect(onClose).toHaveBeenCalledTimes(2)

    rerender(
      <Sheet open={false} onClose={onClose} title="Pod Logs" size="md">
        <p>Body</p>
      </Sheet>,
    )
    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe("")
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it("lets a nested ConfirmActionDialog handle Escape before the underlying Sheet closes", async () => {
    const user = userEvent.setup()
    const onSheetClose = vi.fn()

    function NestedHarness() {
      const [confirmOpen, setConfirmOpen] = useState(true)
      return (
        <Sheet open onClose={onSheetClose} title="Workload" size="md">
          <button type="button" onClick={() => setConfirmOpen(true)}>Trigger</button>
          <ConfirmActionDialog
            open={confirmOpen}
            request={{
              title: "Restart",
              description: "Restart workload?",
              risk: "reversible",
              targetLabel: "Deployment",
              targetValue: "web",
            }}
            onConfirm={() => undefined}
            onCancel={() => setConfirmOpen(false)}
          />
        </Sheet>
      )
    }

    render(<NestedHarness />)
    expect(screen.getByRole("heading", { name: "Restart" })).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("heading", { name: "Restart" })).not.toBeInTheDocument()
    expect(onSheetClose).not.toHaveBeenCalled()

    await user.keyboard("{Escape}")
    expect(onSheetClose).toHaveBeenCalledOnce()
  })
})
