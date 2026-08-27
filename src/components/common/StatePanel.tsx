import { AlertTriangle, LoaderCircle, PackageOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatePanelProps {
  kind: "loading" | "empty" | "error"
  title: string
  description: string
  onRetry?: () => Promise<void>
}

export function StatePanel({ kind, title, description, onRetry }: StatePanelProps) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertTriangle : PackageOpen
  return (
    <Card
      className="flex min-h-[18rem] flex-col items-center justify-center px-6 py-12 text-center"
      data-testid={`${kind}-state`}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon className={cn("mb-4 h-9 w-9 text-accent", kind === "loading" && "animate-spin")} aria-hidden="true" />
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={() => void onRetry()}>
          Try again
        </Button>
      ) : null}
    </Card>
  )
}
