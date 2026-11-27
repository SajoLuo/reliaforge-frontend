import { AlertTriangle, LoaderCircle, PackageOpen } from "lucide-react"
import type { StatePanelProps } from "@reliaforge/plugin-sdk"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

export type { StatePanelProps }

export function StatePanel({ kind, title, description, onRetry, action, className }: StatePanelProps) {
  const { t } = useLocale()
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertTriangle : PackageOpen
  return (
    <Card
      className={cn("flex min-h-[11rem] flex-col items-center justify-center px-6 py-8 text-center", className)}
      data-testid={`${kind}-state`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-panel-inset text-muted">
        <Icon className={cn("h-4 w-4", kind === "loading" && "animate-spin text-accent")} aria-hidden="true" />
      </span>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-md text-xs leading-5 text-muted">{description}</p> : null}
      {onRetry || action ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button variant="secondary" size="small" onClick={() => void onRetry()}>
              {t("common.retry")}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </Card>
  )
}
