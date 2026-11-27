import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ConfirmActionDialog } from "@/components/ops/ConfirmActionDialog"

afterEach(cleanup)

describe("ConfirmActionDialog", () => {
  it("gates sensitive actions on typed target confirmation, shows both warnings, and restores opener focus", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    const opener = document.createElement("button")
    opener.textContent = "Open dialog"
    document.body.appendChild(opener)
    opener.focus()

    const { rerender } = render(
      <ConfirmActionDialog
        open
        request={{
          title: "Scale deployment",
          description: "Change replica count.",
          risk: "sensitive",
          targetLabel: "Deployment",
          targetValue: "default/web",
          argocdManagedWarning: "Managed by Argo CD app web; manual changes may be reverted.",
          warningBanner: "Replicas will drop immediately.",
          details: [{ label: "Replicas", value: "2" }],
        }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Sensitive")).toBeInTheDocument()
    const notes = screen.getAllByRole("note")
    expect(notes).toHaveLength(2)
    expect(notes[0]).toHaveTextContent("Managed by Argo CD")
    expect(notes[1]).toHaveTextContent("Replicas will drop immediately.")
    expect(screen.getByRole("textbox")).toHaveFocus()

    const confirmBtn = screen.getByRole("button", { name: "Confirm" })
    expect(confirmBtn).toBeDisabled()

    await user.type(screen.getByRole("textbox"), "default/web")
    expect(confirmBtn).toBeEnabled()

    await user.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalledOnce()

    await user.keyboard("{Escape}")
    expect(onCancel).toHaveBeenCalledOnce()

    rerender(
      <ConfirmActionDialog open={false} request={null} onConfirm={onConfirm} onCancel={onCancel} />,
    )
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it("allows reversible actions without typing and renders error state", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmActionDialog
        open
        request={{
          title: "Rollout restart",
          description: "Restart pods cleanly.",
          risk: "reversible",
          targetLabel: "Deployment",
          targetValue: "default/api",
        }}
        error="audit_unavailable"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText("Reversible")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("audit_unavailable")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
