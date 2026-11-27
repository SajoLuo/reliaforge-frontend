import { X } from "lucide-react"
import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import type { SheetProps, SheetSize } from "@reliaforge/plugin-sdk"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

export type { SheetProps, SheetSize }

const SIZE_CLASSES: Record<SheetSize, string> = {
  md: "max-w-[480px]",
  lg: "max-w-[720px]",
  xl: "max-w-[960px]",
  full: "max-w-none",
}

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"

function isTopmostOverlay(panel: HTMLElement | null): boolean {
  if (!panel) return false
  const myLevel = Number(panel.dataset.rfOverlayLevel ?? "50")
  const overlays = Array.from(document.querySelectorAll<HTMLElement>("[data-rf-overlay='true']"))
  const highestLevel = overlays.reduce((max, el) => Math.max(max, Number(el.dataset.rfOverlayLevel ?? "50")), 0)
  if (myLevel < highestLevel) return false
  const sameLevel = overlays.filter((el) => Number(el.dataset.rfOverlayLevel ?? "50") === myLevel)
  return sameLevel[sameLevel.length - 1] === panel
}

function cycleSheetFocus(event: KeyboardEvent, panel: HTMLElement | null) {
  if (event.key !== "Tab" || !panel) return
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
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

function SheetBody({
  onClose,
  title,
  meta,
  actions,
  size = "lg",
  children,
  className,
  "data-testid": testId = "sheet",
}: Omit<SheetProps, "open">) {
  const { t } = useLocale()
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const firstFocusable =
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      panelRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopmostOverlay(panelRef.current)) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      cycleSheetFocus(event, panelRef.current)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-inverse/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-rf-overlay="true"
        data-rf-overlay-level="50"
        data-testid={testId}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex h-full w-full flex-col border-l border-line bg-panel text-ink shadow-lift focus:outline-none",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold text-ink">
              {title}
            </h2>
            {meta ? <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">{meta}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={onClose}
              aria-label={t("ops.close")}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Sheet({ open, ...props }: SheetProps) {
  if (!open || typeof document === "undefined") return null
  return createPortal(<SheetBody {...props} />, document.body)
}
