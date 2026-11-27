import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RowActions } from "@/components/ops/RowActions"

afterEach(cleanup)

describe("RowActions", () => {
  it("limits inline icons to two, opens a portal menu with separator and danger styling, and stops click propagation", async () => {
    const user = userEvent.setup()
    const rowClick = vi.fn()
    const onLogs = vi.fn()
    const onExec = vi.fn()
    const onExtra = vi.fn()
    const onDelete = vi.fn()

    render(
      <div onClick={rowClick}>
        <RowActions
          inline={[
            { id: "logs", label: "Logs", onClick: onLogs },
            { id: "exec", label: "Exec", onClick: onExec },
            { id: "ignored", label: "Ignored", onClick: onExtra },
          ]}
          menu={[
            { id: "manifest", label: "Manifest", onClick: onExtra },
            "separator",
            { id: "delete", label: "Delete", tone: "danger", onClick: onDelete },
            { id: "disabled", label: "Disabled", disabled: true, onClick: onExtra },
          ]}
        />
      </div>,
    )

    await user.click(screen.getByRole("button", { name: "Logs" }))
    expect(onLogs).toHaveBeenCalledOnce()
    expect(rowClick).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "Ignored" })).not.toBeInTheDocument()

    const moreBtn = screen.getByRole("button", { name: "More actions" })
    await user.click(moreBtn)
    const menu = screen.getByTestId("row-actions-menu")
    expect(menu.parentElement).toBe(document.body)
    expect(screen.getByRole("separator")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveClass("text-danger-ink")
    expect(screen.getByRole("menuitem", { name: "Disabled" })).toBeDisabled()

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus()

    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(rowClick).not.toHaveBeenCalled()
    expect(screen.queryByTestId("row-actions-menu")).not.toBeInTheDocument()
  })

  it("closes the menu on Escape and outside click", async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">Outside</button>
        <RowActions menu={[{ id: "inspect", label: "Inspect", onClick: () => undefined }]} />
      </div>,
    )

    const trigger = screen.getByRole("button", { name: "More actions" })
    await user.click(trigger)
    expect(screen.getByTestId("row-actions-menu")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByTestId("row-actions-menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    expect(screen.getByTestId("row-actions-menu")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Outside" }))
    expect(screen.queryByTestId("row-actions-menu")).not.toBeInTheDocument()
  })
})
