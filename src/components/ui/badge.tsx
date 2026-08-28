import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger"
}

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-line bg-neutral-soft text-neutral-ink",
  success: "border-success-ink/10 bg-success-soft text-success-ink",
  warning: "border-warning-ink/10 bg-warning-soft text-warning-ink",
  danger: "border-danger-ink/10 bg-danger-soft text-danger-ink",
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5", tones[tone], className)}
      {...props}
    />
  )
}
