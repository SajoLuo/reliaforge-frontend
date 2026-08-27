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
      if (window.innerWidth < 1024 || !open) return
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
    <div className={cn("min-h-screen lg:grid lg:grid-cols-[17rem_1fr]", className)}>
      <aside
        ref={drawerRef}
        id="mobile-navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={t("app.navigation")}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r bg-inverse px-4 py-5 text-inverse-ink lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={handleDrawerKeyDown}
      >
        <div className="flex items-center justify-between px-2">
          <NavLink to={pathFor("/")} className="flex items-center gap-3" onClick={closeNavigation}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-inverse-accent font-black text-inverse">R</span>
            <span>
              <span className="block text-base font-bold">ReliaForge</span>
              <span className="block text-xs text-inverse-muted">{t("app.workspace")}</span>
            </span>
          </NavLink>
          <Button ref={closeButtonRef} className="lg:hidden" variant="ghost" size="small" onClick={closeNavigation} aria-label={t("app.closeNavigation")} aria-controls="mobile-navigation" aria-expanded={open}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-9 space-y-1" aria-label={t("app.primaryNavigation")}>
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={pathFor(to)}
              end={to === "/"}
              onClick={closeNavigation}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-inverse-muted transition-colors hover:bg-inverse-ink/10 hover:text-inverse-ink",
                  isActive && "bg-inverse-accent text-inverse hover:bg-inverse-accent hover:text-inverse",
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t(label as MessageKey)}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-inverse-ink/10 bg-inverse-ink/5 p-3">
            <p className="px-1 text-xs font-semibold text-inverse-muted">{t("app.language")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label={t("app.language")}>
              <button
                type="button"
                className={cn("rounded-lg px-2 py-2 text-xs font-bold transition-colors", locale === "en" ? "bg-inverse-accent text-inverse" : "bg-inverse-ink/10 text-inverse-muted hover:text-inverse-ink")}
                aria-label={t("app.switchToEnglish")}
                aria-pressed={locale === "en"}
                onClick={() => switchLocale("en")}
              >
                {t("app.english")}
              </button>
              <button
                type="button"
                className={cn("rounded-lg px-2 py-2 text-xs font-bold transition-colors", locale === "zh" ? "bg-inverse-accent text-inverse" : "bg-inverse-ink/10 text-inverse-muted hover:text-inverse-ink")}
                aria-label={t("app.switchToChinese")}
                aria-pressed={locale === "zh"}
                onClick={() => switchLocale("zh")}
              >
                {t("app.chinese")}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-inverse-ink/10 bg-inverse-ink/5 p-4 text-xs leading-5 text-inverse-muted">
            {t("app.summary")}
          </div>
        </div>
      </aside>

      <div ref={contentRef} className="min-w-0" data-testid="app-shell-content">
        <div className="sticky top-0 z-30">
          {isDemo ? <DemoNotice /> : null}
          <header className="flex h-16 items-center border-b bg-canvas/90 px-4 backdrop-blur lg:hidden">
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
            <span className="ml-3 font-bold">ReliaForge</span>
          </header>
        </div>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-inverse/55 lg:hidden" role="presentation" onClick={closeNavigation} aria-hidden="true" /> : null}
    </div>
  )
}
