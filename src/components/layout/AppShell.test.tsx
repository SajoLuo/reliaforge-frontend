import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { listPlugins } from "@/api/plugins"
import { AppShell } from "@/components/layout/AppShell"
import { LocaleProvider } from "@/i18n/LocaleProvider"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"
import type { PluginView } from "@/types/plugin"

vi.mock("@/api/plugins", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/plugins")>()
  return { ...actual, listPlugins: vi.fn() }
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  window.localStorage.clear()
})

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

describe("AppShell dynamic plugin navigation without footer bloat", () => {
  it("renders Workspace/Operations/Platform nav groups, routes infra_overview to /, and omits theme/language switchers", async () => {
    const plugins: PluginView[] = [
      {
        id: "infra_overview",
        name: "Infra Overview",
        version: "1.0.0",
        description: "Overview",
        api_version: "v1",
        state: "running",
        available_actions: [],
        dependencies: [],
        capabilities: [],
        settings_schema: {},
        frontend: {
          category: "Infrastructure",
          ui_mode: "esm",
          nav: [{ label: "Overview", label_zh: "总览", path: "", icon: "layers", order: 10, section: "workspace" }],
          provides_themes: [],
          entry_url: "/api/v1/plugins/infra_overview/ui/entry.js?v=1",
          style_url: null,
        },
        health: { status: "healthy", details: null },
      },
      {
        id: "kubernetes",
        name: "Kubernetes",
        version: "1.0.0",
        description: "K8s",
        api_version: "v1",
        state: "running",
        available_actions: [],
        dependencies: [],
        capabilities: [],
        settings_schema: {},
        frontend: {
          category: "Infrastructure",
          ui_mode: "esm",
          nav: [{ label: "Kubernetes", label_zh: "Kubernetes", path: "", icon: "boxes", order: 20, section: "workspace" }],
          provides_themes: [],
          entry_url: null,
          style_url: null,
        },
        health: { status: "healthy", details: null },
      },
      {
        id: "ops_audit",
        name: "Audit",
        version: "1.0.0",
        description: "Audit",
        api_version: "v1",
        state: "stopped",
        available_actions: [],
        dependencies: [],
        capabilities: [],
        settings_schema: {},
        frontend: {
          category: "Ops",
          ui_mode: "esm",
          nav: [{ label: "Audit", label_zh: "审计", path: "", icon: "scroll-text", order: 50, section: "operations" }],
          provides_themes: [],
          entry_url: null,
          style_url: null,
        },
        health: { status: "stopped", details: null },
      },
      {
        id: "platform_guide",
        name: "Platform Guide",
        version: "1.0.0",
        description: "Platform link",
        api_version: "v1",
        state: "running",
        available_actions: [],
        dependencies: [],
        capabilities: [],
        settings_schema: {},
        frontend: {
          category: "Platform",
          ui_mode: "esm",
          nav: [{ label: "System Info", label_zh: "系统信息", path: "", icon: "info", order: 10, section: "platform" }],
          provides_themes: [],
          entry_url: null,
          style_url: null,
        },
        health: { status: "healthy", details: null },
      },
    ]
    vi.mocked(listPlugins).mockResolvedValue({ plugins })
    const importModule = vi.fn().mockResolvedValue({
      default: { apiVersion: "v1", id: "infra_overview", routes: [{ path: "", element: () => <p>Home</p> }] },
    })

    const { container } = render(
      <MemoryRouter initialEntries={["/?lang=zh"]}>
        <LocaleProvider>
          <PluginRuntimeProvider apiOrigin="https://ops.example.com" importModule={importModule}>
            <AppShell><p>Body</p></AppShell>
          </PluginRuntimeProvider>
        </LocaleProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole("link", { name: "总览" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Kubernetes" })).toHaveAttribute("href", "/p/kubernetes")
    expect(screen.getByRole("link", { name: "审计" })).toHaveAttribute("href", "/p/ops_audit")
    expect(screen.getByRole("link", { name: "平台概览" })).toHaveAttribute("href", "/platform")
    expect(screen.getByRole("link", { name: "系统信息" })).toHaveAttribute("href", "/p/platform_guide")
    expect(container.querySelector('[data-status="stopped"]')).toBeInTheDocument()
    expect(container.querySelector('[data-status="healthy"]')).toBeInTheDocument()
    expect(screen.queryByTestId("appearance-switcher")).not.toBeInTheDocument()
    expect(screen.getByText("v0.1.0")).toBeInTheDocument()
  })
})
