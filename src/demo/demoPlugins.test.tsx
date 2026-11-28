import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { DEMO_FRONTEND_PLUGINS } from "@/demo/demoPlugins"
import { LocaleProvider } from "@/i18n/LocaleProvider"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

function renderDemoPlugin(pluginId: keyof typeof DEMO_FRONTEND_PLUGINS, initialEntry = "/") {
  const mod = DEMO_FRONTEND_PLUGINS[pluginId]
  const RouteElement = mod.routes![0].element
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <LocaleProvider>
        <RouteElement pluginId={pluginId} />
      </LocaleProvider>
    </MemoryRouter>,
  )
}

describe("DEMO_FRONTEND_PLUGINS", () => {
  it("renders infra_overview with interactive service catalog filtering and refresh", () => {
    renderDemoPlugin("infra_overview")
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "pve-prod-01" })).toBeInTheDocument()
    expect(screen.getByText("Payments API")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }))
    expect(screen.getByText("Updated just now")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Observability" }))
    expect(screen.getByText("Grafana")).toBeInTheDocument()
    expect(screen.queryByText("Payments API")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "All" }))
    fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "Ledger" } })
    expect(screen.getByText("Ledger Sync")).toBeInTheDocument()
  })

  it("renders proxmox with range switching, filtering, and interactive simulated LXC terminal", () => {
    renderDemoPlugin("proxmox")
    expect(screen.getByRole("heading", { name: "Proxmox" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "24h" }))
    fireEvent.click(screen.getByRole("button", { name: "LXC" }))
    expect(screen.getByText("artifact-cache")).toBeInTheDocument()
    expect(screen.queryByText("ingress-gw-01")).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Shell" })[0])
    const cmdInput = screen.getByLabelText("Mock terminal command")
    for (const cmd of ["help", "uptime", "df -h", "free -h", "ps", "ls", "uname -a", "unknown-cmd", "clear"]) {
      fireEvent.change(cmdInput, { target: { value: cmd } })
      fireEvent.submit(cmdInput.closest("form")!)
    }
    expect(screen.queryByText(/load average/)).not.toBeInTheDocument()
  })

  it("renders kubernetes with namespace filtering and live pod log sheet", () => {
    renderDemoPlugin("kubernetes")
    expect(screen.getByRole("heading", { name: "Kubernetes" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Filter namespace"), { target: { value: "payments" } })
    expect(screen.getByText("payments-api")).toBeInTheDocument()
    expect(screen.queryByText("grafana")).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: "Logs" })[0])
    expect(screen.getByText(/listening=0\.0\.0\.0:8080/)).toBeInTheDocument()
  })

  it("renders gitops_argocd with resource tree sheet", () => {
    renderDemoPlugin("gitops_argocd")
    expect(screen.getByRole("heading", { name: "GitOps" })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole("button", { name: "Tree" })[0])
    expect(screen.getByText("HTTPRoute")).toBeInTheDocument()
  })

  it("renders observability tabs and ops_audit table in both English and Chinese", () => {
    const view = renderDemoPlugin("observability", "/?lang=zh")
    expect(screen.getByRole("heading", { name: "可观测性" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "指标趋势" }))
    expect(screen.getByText("P95 Latency")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "告警与静默" }))
    expect(screen.getByText("NodeDiskMaintenance")).toBeInTheDocument()
    view.unmount()

    renderDemoPlugin("ops_audit", "/?lang=en")
    expect(screen.getByRole("heading", { name: "Operations Audit" })).toBeInTheDocument()
    expect(screen.getByText("k8s.rollout_restart")).toBeInTheDocument()
  })
})
