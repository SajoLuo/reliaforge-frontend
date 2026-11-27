import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { PluginLink, PluginRouteContext, usePluginPath } from "@/runtime/pluginRouting"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

function PathProbe({ explicitPluginId }: { explicitPluginId?: string }) {
  const to = usePluginPath(explicitPluginId)
  return (
    <div>
      <span data-testid="root-path">{to("")}</span>
      <span data-testid="sub-path">{to("/nodes/pve-01?tab=rrd")}</span>
      <PluginLink to="/tasks" pluginId={explicitPluginId}>Tasks</PluginLink>
    </div>
  )
}

describe("pluginRouting", () => {
  it("resolves clean single-prefix plugin paths and links regardless of locale", () => {
    render(
      <MemoryRouter initialEntries={["/p/proxmox?lang=zh"]}>
        <LocaleProvider>
          <PluginRouteContext.Provider value="proxmox">
            <PathProbe />
          </PluginRouteContext.Provider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(screen.getByTestId("root-path")).toHaveTextContent("/p/proxmox")
    expect(screen.getByTestId("sub-path")).toHaveTextContent("/p/proxmox/nodes/pve-01?tab=rrd")
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/p/proxmox/tasks")
  })

  it("supports explicit pluginId overrides and throws outside plugin context", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <LocaleProvider>
          <PathProbe explicitPluginId="kubernetes" />
        </LocaleProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId("root-path")).toHaveTextContent("/p/kubernetes")
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("href", "/p/kubernetes/tasks")

    expect(() =>
      render(
        <MemoryRouter>
          <PathProbe />
        </MemoryRouter>,
      ),
    ).toThrow("usePluginPath requires a pluginId")
  })
})
