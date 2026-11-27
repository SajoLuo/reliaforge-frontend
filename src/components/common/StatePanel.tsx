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
      className={cn("flex min-h-[18rem] flex-col items-center justify-center px-6 py-12 text-center", className)}
      data-testid={`${kind}-state`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
        <Icon className={cn("h-5 w-5", kind === "loading" && "animate-spin")} aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {onRetry || action ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button variant="secondary" onClick={() => void onRetry()}>
              {t("common.retry")}
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </Card>
  )
}
