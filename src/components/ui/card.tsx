import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-lg border border-line bg-panel shadow-panel", className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("space-y-1 border-b border-line px-4 py-3", className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("px-4 py-4", className)} {...props} />
}
