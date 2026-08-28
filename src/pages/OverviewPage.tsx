import { Activity, Boxes, CircleAlert, CircleCheck, RefreshCw, Square } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginList } from "@/components/plugins/PluginList"
import { Button } from "@/components/ui/button"
import { usePlatformStatus, usePlugins } from "@/hooks/usePlugins"
import type { AsyncResource } from "@/hooks/useAsyncResource"
import { useLocale } from "@/i18n/useLocale"

function isInitialLoad<T>(resource: AsyncResource<T>): boolean {
  return resource.loading && resource.data === null
}

function getOverviewSnapshot(status: ReturnType<typeof usePlatformStatus>, catalog: ReturnType<typeof usePlugins>) {
  if (!status.data || !catalog.data) return null
  return { status: status.data, catalog: catalog.data }
}

export function OverviewPage() {
  const { pathFor, t } = useLocale()
  const status = usePlatformStatus()
  const catalog = usePlugins()
  const snapshot = getOverviewSnapshot(status, catalog)

  if (isInitialLoad(status) || isInitialLoad(catalog)) {
    return <StatePanel kind="loading" title={t("overview.loadingTitle")} description={t("overview.loadingDescription")} />
  }

  if (status.error || catalog.error || !snapshot) {
    return (
      <StatePanel
        kind="error"
        title={t("overview.errorTitle")}
        description={status.error || catalog.error || t("overview.errorFallback")}
        onRetry={async () => Promise.all([status.refresh(), catalog.refresh()]).then(() => undefined)}
      />
    )
  }

  const summary = snapshot.status.plugins
  const featured = snapshot.catalog.plugins.slice(0, 3)
  const metrics = [
    { label: t("overview.metricRuntime"), value: t(`health.${snapshot.status.status}`), icon: Activity },
    { label: t("overview.metricPlugins"), value: String(summary.total), icon: Boxes },
    { label: t("overview.metricRunning"), value: String(summary.running), icon: CircleCheck },
    { label: t("overview.metricStopped"), value: String(summary.stopped), icon: Square },
    { label: t("overview.metricAttention"), value: String(summary.degraded + summary.error), icon: CircleAlert },
  ]

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={t("overview.eyebrow", { version: snapshot.status.version })}
        title={t("overview.title")}
        description={t("overview.description")}
        actions={
          <Button variant="secondary" disabled={status.loading || catalog.loading} onClick={() => void Promise.all([status.refresh(), catalog.refresh()])}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t("common.refresh")}
          </Button>
        }
      />

      <section className="overflow-hidden rounded-lg border bg-panel" aria-label={t("overview.summaryLabel")} data-testid="overview-summary">
        <div className="grid grid-cols-2 md:grid-cols-5">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-h-20 items-center gap-2 border-b px-3 py-3 odd:border-r last:col-span-2 last:border-b-0 last:border-r-0 md:min-h-24 md:border-b-0 md:border-r md:last:col-span-1 md:last:border-r-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-soft text-accent"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 truncate text-lg font-semibold capitalize tracking-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("overview.catalog")}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{t("overview.availablePlugins")}</h2>
          </div>
          <Link className="text-sm font-bold text-accent hover:underline" to={pathFor("/plugins")}>{t("overview.viewAll")}</Link>
        </div>
        {featured.length === 0 ? (
          <StatePanel kind="empty" title={t("overview.emptyTitle")} description={t("overview.emptyDescription")} />
        ) : (
          <PluginList plugins={featured} />
        )}
      </section>
    </div>
  )
}
