import type { StatGridProps, StatTileProps } from "@reliaforge/plugin-sdk"
import { cn } from "@/lib/utils"

export type { StatGridProps, StatTileProps }

const TILE_TONE_ACCENTS: Record<NonNullable<StatTileProps["tone"]>, string> = {
  default: "text-ink",
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
  info: "text-info-ink",
}

export function StatGrid({ children, className, ...props }: StatGridProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)} {...props}>
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  meta,
  detail,
  chart,
  icon,
  tone = "default",
  className,
  ...props
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex min-w-[13rem] flex-1 basis-[13rem] flex-col gap-1.5 rounded-lg border border-line bg-panel px-4 py-3 shadow-panel",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="truncate">{label}</span>
        </span>
        {meta ? <span className="shrink-0 tabular-nums">{meta}</span> : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className={cn("min-w-0 truncate text-xl font-semibold tracking-tight tabular-nums", TILE_TONE_ACCENTS[tone])}>
          {value}
        </div>
        {chart ? <div className="shrink-0">{chart}</div> : null}
      </div>
      {detail ? <div className="truncate text-xs text-muted">{detail}</div> : null}
    </div>
  )
}
