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
import { buildPluginPath } from "@/runtime/pluginRouting"
import { useTheme } from "@/theme/ThemeProvider"
import type { FrontendNavSection, PluginView } from "@/types/plugin"

export interface AppShellProps {
  children: ReactNode
  className?: string
}

const navigation = [
  { to: "/", label: "app.overview", icon: Gauge },
  { to: "/plugins", label: "app.plugins", icon: Boxes },
  { to: "/about", label: "app.about", icon: Info },
] as const

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

function collectNavEntries(
  plugins: PluginView[],
  section: FrontendNavSection,
  locale: "en" | "zh",
  pathFor: (path: string) => string,
): SidebarPluginNavEntry[] {
  const entries: SidebarPluginNavEntry[] = []
  for (const plugin of plugins) {
    for (const item of plugin.frontend.nav) {
      if (item.section !== section) continue
      entries.push({
        key: `${plugin.id}:${item.path}:${item.label}`,
        to: buildPluginPath(plugin.id, item.path, pathFor),
        label: locale === "zh" ? (item.label_zh ?? item.label) : item.label,
        icon: (item.icon && navIconMap[item.icon]) || Puzzle,
        order: item.order,
        plugin,
        end: item.path === "",
      })
    }
  }
  return entries.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
}

function pluginNavStatusDot(plugin: PluginView): { tone: string; labelKey: MessageKey } | null {
  if (plugin.state === "running" && plugin.health.status === "healthy") return null
  if (plugin.state === "error" || plugin.health.status === "error") {
    return { tone: "bg-danger", labelKey: "state.error" }
  }
  if (plugin.health.status === "degraded") {
    return { tone: "bg-warning-ink", labelKey: "health.degraded" }
  }
  return { tone: "bg-muted", labelKey: `state.${plugin.state}` }
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
  const { t } = useLocale()
  if (entries.length === 0) return null
  return (
    <div className="space-y-1">
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{title}</p>
      {entries.map(({ key, to, label, icon: Icon, plugin, end }) => {
        const indicator = pluginNavStatusDot(plugin)
        return (
          <NavLink
            key={key}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex min-h-9 items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-neutral-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                isActive && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
              )
            }
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </span>
            {indicator ? (
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", indicator.tone)}
                title={t(indicator.labelKey)}
                aria-label={t(indicator.labelKey)}
              />
            ) : null}
          </NavLink>
        )
      })}
    </div>
  )
}

function AppearanceSwitcher() {
  const { locale, t } = useLocale()
  const { themes, activeThemeId, setTheme } = useTheme()
  if (themes.length < 2) return null
  return (
    <div className="rounded-lg border bg-canvas p-2.5" data-testid="appearance-switcher">
      <label htmlFor="console-theme-select" className="block px-1 text-[11px] font-semibold text-muted">
        {t("app.appearance")}
      </label>
      <select
        id="console-theme-select"
        value={activeThemeId}
        onChange={(event) => setTheme(event.target.value)}
        aria-label={t("app.appearance")}
        className="mt-1.5 w-full rounded-md border bg-panel px-2 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {locale === "zh" ? (theme.labelZh ?? theme.label) : theme.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function SidebarFooter() {
  const { locale, switchLocale, t } = useLocale()
  return (
    <div className="mt-auto space-y-3 pt-4">
      <AppearanceSwitcher />
      <div className="rounded-lg border bg-canvas p-2.5">
        <p className="px-1 text-[11px] font-semibold text-muted">{t("app.language")}</p>
        <div className="mt-2 grid grid-cols-2 gap-1" role="group" aria-label={t("app.language")}>
          <button
            type="button"
            className={cn("min-h-8 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", locale === "en" ? "bg-accent-soft text-accent" : "text-muted hover:bg-neutral-soft hover:text-ink")}
            aria-label={t("app.switchToEnglish")}
            aria-pressed={locale === "en"}
            onClick={() => switchLocale("en")}
          >
            {t("app.english")}
          </button>
          <button
            type="button"
            className={cn("min-h-8 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", locale === "zh" ? "bg-accent-soft text-accent" : "text-muted hover:bg-neutral-soft hover:text-ink")}
            aria-label={t("app.switchToChinese")}
            aria-pressed={locale === "zh"}
            onClick={() => switchLocale("zh")}
          >
            {t("app.chinese")}
          </button>
        </div>
      </div>
      <div className="rounded-lg border bg-panel p-3 text-xs leading-5 text-muted">
        {t("app.summary")}
      </div>
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

  const workspaceEntries = useMemo(
    () => collectNavEntries(plugins, "workspace", locale, pathFor),
    [locale, pathFor, plugins],
  )
  const operationsEntries = useMemo(
    () => collectNavEntries(plugins, "operations", locale, pathFor),
    [locale, pathFor, plugins],
  )
  const platformPluginEntries = useMemo(
    () => collectNavEntries(plugins, "platform", locale, pathFor),
    [locale, pathFor, plugins],
  )
  const hasPluginNav = workspaceEntries.length > 0 || operationsEntries.length > 0

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
          "fixed inset-y-0 left-0 z-40 flex w-[16rem] flex-col overflow-y-auto border-r bg-panel px-3 py-4 text-ink transition-transform md:visible md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={handleDrawerKeyDown}
      >
        <div className="flex min-h-11 items-center justify-between px-2">
          <NavLink to={pathFor("/")} className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" onClick={closeNavigation}>
            <img src={brandMarkPath} alt="" className="brand-mark h-9 w-9 object-contain" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">ReliaForge</span>
          </NavLink>
          <Button ref={closeButtonRef} className="md:hidden" variant="ghost" size="small" onClick={closeNavigation} aria-label={t("app.closeNavigation")} aria-controls="mobile-navigation" aria-expanded={open}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-7 space-y-5" aria-label={t("app.primaryNavigation")}>
          <PluginNavGroup title={t("app.sectionWorkspace")} entries={workspaceEntries} onNavigate={closeNavigation} />
          <PluginNavGroup title={t("app.sectionOperations")} entries={operationsEntries} onNavigate={closeNavigation} />

          <div className="space-y-1">
            {hasPluginNav ? (
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                {t("app.sectionPlatform")}
              </p>
            ) : null}
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={pathFor(to)}
                end={to === "/"}
                onClick={closeNavigation}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-neutral-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                    isActive && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
                  )
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(label as MessageKey)}
              </NavLink>
            ))}
            {platformPluginEntries.map(({ key, to, label, icon: Icon, plugin, end }) => {
              const indicator = pluginNavStatusDot(plugin)
              return (
                <NavLink
                  key={key}
                  to={to}
                  end={end}
                  onClick={closeNavigation}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-neutral-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                      isActive && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
                    )
                  }
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </span>
                  {indicator ? (
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", indicator.tone)}
                      title={t(indicator.labelKey)}
                      aria-label={t(indicator.labelKey)}
                    />
                  ) : null}
                </NavLink>
              )
            })}
          </div>
        </nav>

        <SidebarFooter />
      </aside>

      <div ref={contentRef} className="min-w-0" data-testid="app-shell-content">
        <div className="sticky top-0 z-30">
          {isDemo ? <DemoNotice /> : null}
          <header className="flex h-14 items-center border-b bg-panel/95 px-4 backdrop-blur md:hidden">
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
            <img src={brandMarkPath} alt="" className="brand-mark ml-3 h-8 w-8 object-contain" aria-hidden="true" />
            <span className="ml-2 font-bold">ReliaForge</span>
          </header>
        </div>
        <main className="mx-auto w-full max-w-[76rem] px-4 py-8 sm:px-6 md:px-8 md:py-10 xl:px-12">{children}</main>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-inverse/45 md:hidden" role="presentation" onClick={closeNavigation} aria-hidden="true" /> : null}
    </div>
  )
}
