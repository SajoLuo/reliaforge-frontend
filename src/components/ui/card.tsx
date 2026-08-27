import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn("rounded-2xl border bg-panel shadow-lift", className)} {...props} />
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("space-y-1 border-b px-5 py-4", className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("px-5 py-5", className)} {...props} />
}
