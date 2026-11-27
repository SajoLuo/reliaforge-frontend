import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent px-3.5 py-2 text-accent-ink hover:brightness-95",
        secondary: "border-line bg-panel px-3.5 py-2 text-ink hover:bg-neutral-soft",
        ghost: "px-2.5 py-1.5 text-muted hover:bg-neutral-soft hover:text-ink",
        danger: "bg-danger px-3.5 py-2 text-danger-button-ink hover:brightness-90",
      },
      size: {
        default: "h-9",
        small: "h-8 px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  ),
)
Button.displayName = "Button"
