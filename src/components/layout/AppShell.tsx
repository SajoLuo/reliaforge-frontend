import {
  Activity,
  AlertTriangle,
  Boxes,
  Cpu,
  Database,
  Eye,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  HardDrive,
  Info,
  Layers,
  Menu,
  Network,
  Palette,
  Puzzle,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { DemoNotice } from "@/components/layout/DemoNotice"
import { Button } from "@/components/ui/button"
import { isDemo } from "@/config/buildMode"
import type { MessageKey } from "@/i18n/messages"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import { usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import { HOME_WORKSPACE_PLUGIN_ID, isHomeWorkspacePlugin } from "@/runtime/homeWorkspace"
import { buildPluginPath } from "@/runtime/pluginRouting"
import type { FrontendNavItem, FrontendNavSection, PluginView } from "@/types/plugin"

export interface AppShellProps {
  children: ReactNode
  className?: string
}

const navIconMap: Record<string, LucideIcon> = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  boxes: Boxes,
  cpu: Cpu,
  database: Database,
  eye: Eye,
  "file-text": FileText,
  gauge: Gauge,
  "git-branch": GitBranch,
  globe: Globe,
  "hard-drive": HardDrive,
  info: Info,
  layers: Layers,
  network: Network,
  palette: Palette,
  puzzle: Puzzle,
  "scroll-text": ScrollText,
  server: Server,
  shield: Shield,
  "shield-check": ShieldCheck,
  terminal: Terminal,
  wrench: Wrench,
}

interface SidebarPluginNavEntry {
  key: string
  to: string
  label: string
  icon: LucideIcon
  order: number
  plugin: PluginView
  end: boolean
}

const focusableSelector = "a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"
const brandMarkPath = `${import.meta.env.BASE_URL}reliaforge-mark.png`

function cycleDrawerFocus(event: KeyboardEvent<HTMLElement>, drawer: HTMLElement | null) {
  if (event.key !== "Tab") return
  const focusable = Array.from(drawer?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function toSidebarNavEntry(
  plugin: PluginView,
  item: FrontendNavItem,
  locale: "en" | "zh",
  pathFor: (path: string) => string,
  hasHomePlugin: boolean,
): SidebarPluginNavEntry {
  const isHomeRoot = hasHomePlugin && plugin.id === HOME_WORKSPACE_PLUGIN_ID && item.path === ""
  const label = locale === "zh" ? (item.label_zh ?? item.label) : item.label
  const icon = (item.icon && navIconMap[item.icon]) || Puzzle
  return {
    key: `${plugin.id}:${item.path}:${item.label}`,
    to: isHomeRoot ? pathFor("/") : buildPluginPath(plugin.id, item.path, pathFor),
    label,
    icon,
    order: item.order,
    plugin,
    end: item.path === "",
  }
}

function collectNavEntries(
  plugins: PluginView[],
  section: FrontendNavSection,
  locale: "en" | "zh",
  pathFor: (path: string) => string,
  hasHomePlugin: boolean,
): SidebarPluginNavEntry[] {
  const entries = plugins.flatMap((plugin) =>
    plugin.frontend.nav
      .filter((item) => item.section === section)
      .map((item) => toSidebarNavEntry(plugin, item, locale, pathFor, hasHomePlugin)),
  )
  return entries.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
}

function pluginNavStatusDot(plugin: PluginView): { tone: string; status: string; labelKey: MessageKey } {
  if (plugin.state === "running" && plugin.health.status === "healthy") {
    return { tone: "bg-success", status: "healthy", labelKey: "health.healthy" }
  }
  if (plugin.state === "error" || plugin.health.status === "error") {
    return { tone: "bg-danger", status: "error", labelKey: "state.error" }
  }
  if (plugin.health.status === "degraded") {
    return { tone: "bg-warning", status: "degraded", labelKey: "health.degraded" }
  }
  return { tone: "bg-muted/60", status: plugin.state, labelKey: `state.${plugin.state}` }
}

function SidebarNavRow({
  to,
  label,
  icon: Icon,
  end,
  indicator,
  onNavigate,
}: {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
  indicator?: { tone: string; status: string; labelKey: MessageKey }
  onNavigate: () => void
}) {
  const { t } = useLocale()
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-8 items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-neutral-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          isActive && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
        )
      }
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {indicator ? (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", indicator.tone)}
          title={t(indicator.labelKey)}
          data-status={indicator.status}
          aria-hidden="true"
        />
      ) : null}
    </NavLink>
  )
}

function PluginNavGroup({
  title,
  entries,
  onNavigate,
}: {
  title: string
  entries: SidebarPluginNavEntry[]
  onNavigate: () => void
}) {
  if (entries.length === 0) return null
  return (
    <div className="space-y-0.5">
      <p className="px-2.5 pb-1 text-[11px] font-medium text-muted/80">{title}</p>
      {entries.map((entry) => (
        <SidebarNavRow
          key={entry.key}
          to={entry.to}
          label={entry.label}
          icon={entry.icon}
          end={entry.end}
          indicator={pluginNavStatusDot(entry.plugin)}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

export function AppShell({ children, className }: AppShellProps) {
  const { locale, pathFor, t } = useLocale()
  const { plugins } = usePluginRuntime()
  const [open, setOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const resizeFocusFrameRef = useRef<number | null>(null)

  const hasHomePlugin = useMemo(() => plugins.some(isHomeWorkspacePlugin), [plugins])
  const workspaceEntries = useMemo(
    () => collectNavEntries(plugins, "workspace", locale, pathFor, hasHomePlugin),
    [hasHomePlugin, locale, pathFor, plugins],
  )
  const operationsEntries = useMemo(
    () => collectNavEntries(plugins, "operations", locale, pathFor, hasHomePlugin),
    [hasHomePlugin, locale, pathFor, plugins],
  )
  const platformPluginEntries = useMemo(
    () => collectNavEntries(plugins, "platform", locale, pathFor, hasHomePlugin),
    [hasHomePlugin, locale, pathFor, plugins],
  )
  const hasPluginNav = workspaceEntries.length > 0 || operationsEntries.length > 0
  const platformNavigation = useMemo(
    () => [
      hasHomePlugin
        ? { to: "/platform", label: "app.platformOverview" as const, icon: Gauge }
        : { to: "/", label: "app.overview" as const, icon: Gauge },
      { to: "/plugins", label: "app.plugins" as const, icon: Boxes },
      { to: "/about", label: "app.about" as const, icon: Info },
    ],
    [hasHomePlugin],
  )

  useEffect(() => () => {
    if (resizeFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFocusFrameRef.current)
    }
  }, [])

  useEffect(() => {
    const content = contentRef.current
    content?.toggleAttribute("inert", open)
    const focusFrame = open
      ? window.requestAnimationFrame(() => closeButtonRef.current?.focus())
      : null
    return () => {
      if (focusFrame !== null) window.cancelAnimationFrame(focusFrame)
      content?.removeAttribute("inert")
    }
  }, [open])

  useEffect(() => {
    const closeAtDesktopWidth = () => {
      if (window.innerWidth < 768 || !open) return
      setOpen(false)
      if (resizeFocusFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFocusFrameRef.current)
      }
      resizeFocusFrameRef.current = window.requestAnimationFrame(() => {
        drawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
        resizeFocusFrameRef.current = null
      })
    }
    window.addEventListener("resize", closeAtDesktopWidth)
    return () => window.removeEventListener("resize", closeAtDesktopWidth)
  }, [open])

  const closeNavigation = () => {
    setOpen(false)
    if (open) {
      window.requestAnimationFrame(() => openButtonRef.current?.focus())
    }
  }

  const handleDrawerKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!open) return
    if (event.key === "Escape") {
      closeNavigation()
      return
    }
    cycleDrawerFocus(event, drawerRef.current)
  }

  return (
    <div className={cn("min-h-screen md:grid md:grid-cols-[13rem_minmax(0,1fr)]", className)}>
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={t("app.navigation")}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[16rem] flex-col overflow-y-auto border-r border-line bg-panel px-3 py-4 text-ink transition-transform md:visible md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={handleDrawerKeyDown}
      >
        <div className="flex min-h-10 items-center justify-between px-2">
          <NavLink
            to={pathFor("/")}
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            onClick={closeNavigation}
          >
            <img src={brandMarkPath} alt="" className="brand-mark h-8 w-8 object-contain" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">ReliaForge</span>
          </NavLink>
          <Button
            ref={closeButtonRef}
            className="md:hidden"
            variant="ghost"
            size="small"
            onClick={closeNavigation}
            aria-label={t("app.closeNavigation")}
            aria-controls="mobile-navigation"
            aria-expanded={open}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-5 space-y-4" aria-label={t("app.primaryNavigation")}>
          <PluginNavGroup title={t("app.sectionWorkspace")} entries={workspaceEntries} onNavigate={closeNavigation} />
          <PluginNavGroup title={t("app.sectionOperations")} entries={operationsEntries} onNavigate={closeNavigation} />

          <div className="space-y-0.5">
            {hasPluginNav ? (
              <p className="px-2.5 pb-1 text-[11px] font-medium text-muted/80">
                {t("app.sectionPlatform")}
              </p>
            ) : null}
            {platformNavigation.map(({ to, label, icon }) => (
              <SidebarNavRow
                key={to}
                to={pathFor(to)}
                label={t(label)}
                icon={icon}
                end={to === "/" || to === "/platform"}
                onNavigate={closeNavigation}
              />
            ))}
            {platformPluginEntries.map((entry) => (
              <SidebarNavRow
                key={entry.key}
                to={entry.to}
                label={entry.label}
                icon={entry.icon}
                end={entry.end}
                indicator={pluginNavStatusDot(entry.plugin)}
                onNavigate={closeNavigation}
              />
            ))}
          </div>
        </nav>

        <div className="mt-auto px-2.5 pt-4">
          <p className="font-mono text-[11px] text-muted/70 tabular-nums">v0.1.0</p>
        </div>
      </aside>

      <div ref={contentRef} className="min-w-0" data-testid="app-shell-content">
        <div className="sticky top-0 z-30">
          {isDemo ? <DemoNotice /> : null}
          <header className="flex h-12 items-center border-b border-line bg-panel/95 px-4 backdrop-blur md:hidden">
            <Button
              ref={openButtonRef}
              variant="secondary"
              size="small"
              onClick={() => setOpen(true)}
              aria-label={t("app.openNavigation")}
              aria-controls="mobile-navigation"
              aria-expanded={open}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <img src={brandMarkPath} alt="" className="brand-mark ml-3 h-7 w-7 object-contain" aria-hidden="true" />
            <span className="ml-2 text-sm font-semibold">ReliaForge</span>
          </header>
        </div>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 md:py-6">{children}</main>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-inverse/45 md:hidden" role="presentation" onClick={closeNavigation} aria-hidden="true" /> : null}
    </div>
  )
}
