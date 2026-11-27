import { Activity, Boxes, CircleAlert, CircleCheck, RefreshCw, Square } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status } from "@/components/ops/Status"
import { PluginErrorBoundary } from "@/components/plugins/PluginErrorBoundary"
import { PluginList } from "@/components/plugins/PluginList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { AsyncResource } from "@/hooks/useAsyncResource"
import { usePlatformStatus, usePlugins } from "@/hooks/usePlugins"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import { usePluginRuntime, type RegisteredOverviewWidget } from "@/runtime/PluginRuntimeProvider"
import type { PlatformStatusResponse } from "@/types/plugin"

export interface OverviewPageProps {
  mode?: "overview" | "platform"
}

function isInitialLoad<T>(resource: AsyncResource<T>): boolean {
  return resource.loading && resource.data === null
}

function getOverviewSnapshot(status: ReturnType<typeof usePlatformStatus>, catalog: ReturnType<typeof usePlugins>) {
  if (!status.data || !catalog.data) return null
  return { status: status.data, catalog: catalog.data }
}

function OverviewMetrics({ status }: { status: PlatformStatusResponse }) {
  const { t } = useLocale()
  const summary = status.plugins
  const attention = summary.degraded + summary.error

  return (
    <section aria-label={t("overview.summaryLabel")} data-testid="overview-summary">
      <StatGrid>
        <StatTile
          label={t("overview.metricRuntime")}
          value={<Status value={status.status} />}
          icon={<Activity className="h-3.5 w-3.5" aria-hidden="true" />}
        />
        <StatTile
          label={t("overview.metricPlugins")}
          value={summary.total}
          icon={<Boxes className="h-3.5 w-3.5" aria-hidden="true" />}
        />
        <StatTile
          label={t("overview.metricRunning")}
          value={summary.running}
          tone="success"
          icon={<CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />}
        />
        <StatTile
          label={t("overview.metricStopped")}
          value={summary.stopped}
          icon={<Square className="h-3.5 w-3.5" aria-hidden="true" />}
        />
        <StatTile
          label={t("overview.metricAttention")}
          value={attention}
          tone={attention > 0 ? "warning" : "default"}
          icon={<CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
        />
      </StatGrid>
    </section>
  )
}

function OverviewWidgets({ widgets }: { widgets: RegisteredOverviewWidget[] }) {
  const { locale, t } = useLocale()
  if (widgets.length === 0) return null
  return (
    <section className="space-y-3" data-testid="overview-plugin-widgets">
      <h2 className="text-sm font-semibold text-ink">{t("overview.widgetsTitle")}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {widgets.map((widget) => {
          const WidgetComponent = widget.component
          return (
            <div
              key={`${widget.pluginId}:${widget.id}`}
              data-rf-plugin={widget.pluginId}
              className={cn(widget.span === 2 && "md:col-span-2")}
            >
              <PluginErrorBoundary pluginId={widget.pluginId}>
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-ink">
                      {locale === "zh" ? (widget.titleZh ?? widget.title) : widget.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <WidgetComponent pluginId={widget.pluginId} />
                  </CardContent>
                </Card>
              </PluginErrorBoundary>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function OverviewContent({
  mode,
  snapshot,
  loading,
  onRefresh,
}: {
  mode: "overview" | "platform"
  snapshot: { status: PlatformStatusResponse; catalog: { plugins: import("@/types/plugin").PluginView[] } }
  loading: boolean
  onRefresh: () => void
}) {
  const { pathFor, t } = useLocale()
  const runtime = usePluginRuntime()
  const featured = snapshot.catalog.plugins.slice(0, 3)

  return (
    <div className="space-y-5">
      <PageHeader
        title={mode === "platform" ? t("overview.platformTitle") : t("overview.title")}
        meta={
          <>
            <Status value={snapshot.status.status} />
            <Badge className="font-mono tabular-nums">v{snapshot.status.version}</Badge>
          </>
        }
        actions={
          <Button variant="secondary" size="small" disabled={loading} onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("common.refresh")}
          </Button>
        }
      />

      <OverviewMetrics status={snapshot.status} />
      <OverviewWidgets widgets={runtime.widgets} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-ink">{t("overview.availablePlugins")}</h2>
          <Link className="text-xs font-medium text-accent hover:underline" to={pathFor("/plugins")}>
            {t("overview.viewAll")}
          </Link>
        </div>
        {featured.length === 0 ? (
          <StatePanel kind="empty" title={t("overview.emptyTitle")} />
        ) : (
          <PluginList plugins={featured} />
        )}
      </section>
    </div>
  )
}

export function OverviewPage({ mode = "overview" }: OverviewPageProps) {
  const { t } = useLocale()
  const status = usePlatformStatus()
  const catalog = usePlugins()
  const runtime = usePluginRuntime()
  const snapshot = getOverviewSnapshot(status, catalog)
  const refreshAll = () => Promise.all([status.refresh(), catalog.refresh(), runtime.refresh()]).then(() => undefined)

  if (isInitialLoad(status) || isInitialLoad(catalog)) {
    return <StatePanel kind="loading" title={t("overview.loadingTitle")} />
  }

  const readError = status.error || catalog.error
  if (readError || !snapshot) {
    return (
      <StatePanel
        kind="error"
        title={t("overview.errorTitle")}
        description={readError || t("overview.errorFallback")}
        onRetry={refreshAll}
      />
    )
  }

  return (
    <OverviewContent
      mode={mode}
      snapshot={snapshot}
      loading={status.loading || catalog.loading}
      onRefresh={() => void refreshAll()}
    />
  )
}
