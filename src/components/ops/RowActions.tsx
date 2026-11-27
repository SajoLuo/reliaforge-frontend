import { MoreHorizontal } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { RowActionItem, RowActionMenuEntry, RowActionsProps } from "@reliaforge/plugin-sdk"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

export type { RowActionItem, RowActionMenuEntry, RowActionsProps }

interface MenuPosition {
  top: number
  left: number
}

function computeMenuPosition(triggerRect: DOMRect, menuWidth: number, menuHeight: number): MenuPosition {
  const padding = 8
  const spaceBelow = window.innerHeight - triggerRect.bottom
  const openUpward = spaceBelow < menuHeight + padding && triggerRect.top > menuHeight + padding
  const rawTop = openUpward ? triggerRect.top - menuHeight - 4 : triggerRect.bottom + 4
  const top = Math.max(padding, Math.min(rawTop, window.innerHeight - menuHeight - padding))
  const rawLeft = triggerRect.right - menuWidth
  const left = Math.max(padding, Math.min(rawLeft, window.innerWidth - menuWidth - padding))
  return { top, left }
}

function handleMenuListKeyDown(event: React.KeyboardEvent<HTMLDivElement>, closeAndFocus: () => void) {
  if (event.key === "Escape") {
    event.preventDefault()
    event.stopPropagation()
    closeAndFocus()
    return
  }
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)"))
  if (items.length === 0) return
  const index = items.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === "ArrowDown") {
    event.preventDefault()
    items[(index + 1) % items.length].focus()
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    items[(index - 1 + items.length) % items.length].focus()
  } else if (event.key === "Home") {
    event.preventDefault()
    items[0].focus()
  } else if (event.key === "End") {
    event.preventDefault()
    items[items.length - 1].focus()
  }
}

function InlineActionButton({ item }: { item: RowActionItem }) {
  const toneClass = item.tone === "danger"
    ? "text-danger-ink hover:bg-danger-soft hover:text-danger-ink"
    : "text-muted hover:bg-neutral-soft hover:text-ink"
  return (
    <Button
      type="button"
      variant="ghost"
      size="small"
      disabled={item.disabled}
      title={item.title ?? item.label}
      aria-label={item.label}
      onClick={(event) => {
        event.stopPropagation()
        item.onClick()
      }}
      className={cn("h-7 w-7 p-0", toneClass)}
    >
      {item.icon ?? <span className="text-xs font-medium">{item.label.slice(0, 1)}</span>}
    </Button>
  )
}

function MenuPortal({
  entries,
  triggerRef,
  onClose,
}: {
  entries: RowActionMenuEntry[]
  triggerRef: React.RefObject<HTMLButtonElement>
  onClose: (restoreFocus?: boolean) => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<MenuPosition>({ top: -9999, left: -9999 })

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return
    const triggerRect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    setPosition(computeMenuPosition(triggerRect, menuRect.width || 168, menuRect.height || 120))
  }, [triggerRef])

  useLayoutEffect(() => {
    updatePosition()
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")
    firstItem?.focus()
  }, [updatePosition])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      onClose(false)
    }
    const onViewportChange = () => onClose(false)
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [onClose, triggerRef])

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      data-testid="row-actions-menu"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => handleMenuListKeyDown(event, () => onClose(true))}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[55] min-w-[10.5rem] rounded-md border border-line bg-panel p-1 text-ink shadow-lift"
    >
      {entries.map((entry, index) => {
        if (entry === "separator") {
          return <div key={`sep-${index}`} role="separator" className="my-1 border-t border-line" />
        }
        const danger = entry.tone === "danger"
        return (
          <button
            key={entry.id}
            type="button"
            role="menuitem"
            disabled={entry.disabled}
            title={entry.title}
            onClick={() => {
              onClose(false)
              entry.onClick()
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-45",
              danger ? "text-danger-ink hover:bg-danger-soft" : "text-ink hover:bg-neutral-soft",
            )}
          >
            {entry.icon ? <span className="shrink-0 opacity-85">{entry.icon}</span> : null}
            <span className="truncate">{entry.label}</span>
          </button>
        )
      })}
    </div>,
    document.body,
  )
}

export function RowActions({ inline = [], menu = [], menuLabel, className }: RowActionsProps) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const visibleInline = inline.slice(0, 2)
  const hasMenuItems = menu.some((entry) => entry !== "separator")
  const triggerLabel = menuLabel ?? t("ops.moreActions")

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus())
    }
  }, [])

  return (
    <div
      className={cn("inline-flex items-center justify-end gap-1", className)}
      onClick={(event) => event.stopPropagation()}
    >
      {visibleInline.map((item) => (
        <InlineActionButton key={item.id} item={item} />
      ))}
      {hasMenuItems ? (
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="small"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={triggerLabel}
          title={triggerLabel}
          onClick={(event) => {
            event.stopPropagation()
            setOpen((prev) => !prev)
          }}
          className="h-7 w-7 p-0 text-muted hover:bg-neutral-soft hover:text-ink"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
      {open && typeof document !== "undefined" ? (
        <MenuPortal entries={menu} triggerRef={triggerRef} onClose={closeMenu} />
      ) : null}
    </div>
  )
}
