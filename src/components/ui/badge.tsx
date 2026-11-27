import type { HTMLAttributes } from "react"
import type { BadgeProps } from "@reliaforge/plugin-sdk"
import { cn } from "@/lib/utils"

export type { BadgeProps }

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-line bg-neutral-soft text-neutral-ink",
  success: "border-success/20 bg-success-soft text-success-ink",
  warning: "border-warning/25 bg-warning-soft text-warning-ink",
  danger: "border-danger/25 bg-danger-soft text-danger-ink",
  info: "border-info/25 bg-info-soft text-info-ink",
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}

export type BadgeSpanProps = HTMLAttributes<HTMLSpanElement>
