import { Boxes, Gauge, Info, Menu, X } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { DemoNotice } from "@/components/layout/DemoNotice"
import { Button } from "@/components/ui/button"
import { isDemo } from "@/config/buildMode"
import { useLocale } from "@/i18n/useLocale"
import type { MessageKey } from "@/i18n/messages"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  children: ReactNode
  className?: string
}

const navigation = [
  { to: "/", label: "app.overview", icon: Gauge },
  { to: "/plugins", label: "app.plugins", icon: Boxes },
  { to: "/about", label: "app.about", icon: Info },
] as const

const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
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

export function AppShell({ children, className }: AppShellProps) {
  const { locale, pathFor, switchLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const resizeFocusFrameRef = useRef<number | null>(null)

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

  const openNavigation = () => {
    setOpen(true)
  }

  const closeNavigation = () => {
    const shouldRestoreFocus = open
    setOpen(false)
    if (shouldRestoreFocus) {
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
          "fixed inset-y-0 left-0 z-40 flex w-[16rem] flex-col border-r bg-panel px-3 py-4 text-ink transition-transform md:visible md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={handleDrawerKeyDown}
      >
        <div className="flex min-h-11 items-center justify-between px-2">
          <NavLink to={pathFor("/")} className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" onClick={closeNavigation}>
            <img
              src={brandMarkPath}
              alt=""
              className="brand-mark h-9 w-9 object-contain"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold tracking-tight">ReliaForge</span>
          </NavLink>
          <Button ref={closeButtonRef} className="md:hidden" variant="ghost" size="small" onClick={closeNavigation} aria-label={t("app.closeNavigation")} aria-controls="mobile-navigation" aria-expanded={open}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-7 space-y-1" aria-label={t("app.primaryNavigation")}>
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
        </nav>

        <div className="mt-auto space-y-3">
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
      </aside>

      <div ref={contentRef} className="min-w-0" data-testid="app-shell-content">
        <div className="sticky top-0 z-30">
          {isDemo ? <DemoNotice /> : null}
          <header className="flex h-14 items-center border-b bg-panel/95 px-4 backdrop-blur md:hidden">
            <Button
              ref={openButtonRef}
              variant="secondary"
              size="small"
              onClick={openNavigation}
              aria-label={t("app.openNavigation")}
              aria-controls="mobile-navigation"
              aria-expanded={open}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <img
              src={brandMarkPath}
              alt=""
              className="brand-mark ml-3 h-8 w-8 object-contain"
              aria-hidden="true"
            />
            <span className="ml-2 font-bold">ReliaForge</span>
          </header>
        </div>
        <main className="mx-auto w-full max-w-[76rem] px-4 py-8 sm:px-6 md:px-8 md:py-10 xl:px-12">{children}</main>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-inverse/45 md:hidden" role="presentation" onClick={closeNavigation} aria-hidden="true" /> : null}
    </div>
  )
}
