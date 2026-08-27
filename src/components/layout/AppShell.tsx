import { Boxes, Gauge, Info, Menu, X } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  children: ReactNode
  className?: string
}

const navigation = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/plugins", label: "Plugins", icon: Boxes },
  { to: "/about", label: "About", icon: Info },
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
        aria-label="Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r bg-inverse px-4 py-5 text-inverse-ink lg:visible lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
        onKeyDown={handleDrawerKeyDown}
      >
        <div className="flex items-center justify-between px-2">
          <NavLink to="/" className="flex items-center gap-3" onClick={closeNavigation}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-inverse-accent font-black text-inverse">R</span>
            <span>
              <span className="block text-base font-bold">ReliaForge</span>
              <span className="block text-xs text-inverse-muted">Plugin workspace</span>
            </span>
          </NavLink>
          <Button ref={closeButtonRef} className="lg:hidden" variant="ghost" size="small" onClick={closeNavigation} aria-label="Close navigation" aria-controls="mobile-navigation" aria-expanded={open}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <nav className="mt-9 space-y-1" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-inverse-ink/10 bg-inverse-ink/5 p-4 text-xs leading-5 text-inverse-muted">
          A neutral control plane for small, inspectable operations plugins.
        </div>
      </aside>

      <div ref={contentRef} className="min-w-0" data-testid="app-shell-content">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-canvas/90 px-4 backdrop-blur lg:hidden">
          <Button
            ref={openButtonRef}
            variant="secondary"
            size="small"
            onClick={openNavigation}
            aria-label="Open navigation"
            aria-controls="mobile-navigation"
            aria-expanded={open}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="ml-3 font-bold">ReliaForge</span>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
      </div>
      {open ? <div className="fixed inset-0 z-30 bg-inverse/55 lg:hidden" role="presentation" onClick={closeNavigation} aria-hidden="true" /> : null}
    </div>
  )
}
