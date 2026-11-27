import { ArrowLeft, ArrowUpRight, Play, RefreshCw, Square, type LucideIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { RelativeTime } from "@/components/ops/RelativeTime"
import { Status } from "@/components/ops/Status"
import { PluginStateBadge } from "@/components/plugins/PluginStateBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { usePlugin, type UsePluginReturn } from "@/hooks/usePlugins"
import { pluginPresentation } from "@/i18n/pluginPresentation"
import { useLocale } from "@/i18n/useLocale"
import { usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import type { PluginAction, PluginView } from "@/types/plugin"

interface ActionDefinition {
  icon: LucideIcon
  variant: "primary" | "secondary" | "danger"
}

const actionDefinitions: Record<PluginAction, ActionDefinition> = {
  start: { icon: Play, variant: "primary" },
  stop: { icon: Square, variant: "danger" },
  restart: { icon: RefreshCw, variant: "secondary" },
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5 last:border-b-0 last:pb-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{children}</span>
    </div>
  )
}

function HealthDetailsCard({ details }: { details: PluginView["health"]["details"] }) {
  const { t } = useLocale()
  if (!details || Object.keys(details).length === 0) return null
  return (
    <Card>
      <CardHeader><h2 className="text-sm font-semibold text-ink">{t("detail.healthDetails")}</h2></CardHeader>
      <CardContent>
        <dl className="space-y-2.5 text-xs">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
              <dt className="break-words font-mono font-medium text-ink">{key}</dt>
              <dd className="break-words font-mono text-muted">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function LifecycleActions({
  actions,
  pending,
  disabled,
  onAction,
}: {
  actions: PluginAction[]
  pending: PluginAction | null
  disabled: boolean
  onAction: (action: PluginAction) => Promise<unknown>
}) {
  const { t } = useLocale()
  return actions.map((action) => {
    const { icon: Icon, variant } = actionDefinitions[action]
    const label = t(`action.${action}`)
    return (
      <Button
        key={action}
        variant={variant}
        size="small"
        disabled={disabled || pending !== null}
        aria-busy={pending === action}
        onClick={() => {
          const needsConfirmation = action === "stop" || action === "restart"
          if (needsConfirmation && !window.confirm(t("action.confirm", { action: label }))) return
          void onAction(action)
        }}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </Button>
    )
  })
}

function PluginDependenciesList({ dependencies }: { dependencies: PluginView["dependencies"] }) {
  const { t } = useLocale()
  return (
    <div>
      <h3 className="text-xs font-medium text-muted">{t("detail.dependencies")}</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {dependencies.length
          ? dependencies.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs">{item.id}</span>
              <span className="font-mono text-xs text-muted">{item.version}</span>
              {item.optional ? <Badge>{t("detail.optional")}</Badge> : null}
            </li>
          ))
          : <li className="text-xs text-muted">{t("detail.noDependencies")}</li>}
      </ul>
    </div>
  )
}

function DetailHeaderActions({
  plugin,
  canOpenWorkspace,
  refreshing,
  actionPending,
  onRefresh,
  performAction,
}: {
  plugin: PluginView
  canOpenWorkspace: boolean
  refreshing: boolean
  actionPending: UsePluginReturn["actionPending"]
  onRefresh: () => Promise<void>
  performAction: UsePluginReturn["performAction"]
}) {
  const { pathFor, t } = useLocale()
  return (
    <>
      {canOpenWorkspace ? (
        <Link
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-ink transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          to={pathFor(`/p/${encodeURIComponent(plugin.id)}`)}
        >
          {t("detail.openWorkspace")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : null}
      <Button variant="secondary" size="small" disabled={refreshing || actionPending !== null} aria-busy={refreshing} onClick={() => void onRefresh()}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("common.refresh")}
      </Button>
      {plugin.available_actions.length ? (
        <LifecycleActions actions={plugin.available_actions} pending={actionPending} disabled={refreshing} onAction={performAction} />
      ) : null}
    </>
  )
}

function PluginDetailContent({
  plugin: data,
  hasWorkspaceRoutes,
  updatedAt,
  refreshing,
  actionPending,
  actionError,
  onRefresh,
  performAction,
}: {
  plugin: PluginView
  hasWorkspaceRoutes: boolean
  updatedAt: number | null
  refreshing: boolean
  actionPending: UsePluginReturn["actionPending"]
  actionError: UsePluginReturn["actionError"]
  onRefresh: () => Promise<void>
  performAction: UsePluginReturn["performAction"]
}) {
  const { locale, pathFor, t } = useLocale()
  const runtime = usePluginRuntime()
  const presentation = pluginPresentation(data, t, {
    locale,
    meta: runtime.loadedPlugins[data.id]?.meta,
  })
  const canOpenWorkspace = (
    data.state === "running"
    && data.frontend.ui_mode === "esm"
    && Boolean(data.frontend.entry_url)
    && (data.frontend.nav.length > 0 || hasWorkspaceRoutes)
  )
  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" to={pathFor("/plugins")}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {t("detail.back")}
      </Link>
      <PageHeader
        title={presentation.name}
        meta={
          <>
            <span className="font-mono">{data.id} · API {data.api_version}</span>
            <PluginStateBadge state={data.state} />
            {updatedAt !== null ? (
              <span className="inline-flex items-center gap-1">
                {t("detail.lastChecked")}: <RelativeTime value={updatedAt} />
              </span>
            ) : null}
          </>
        }
        actions={
          <DetailHeaderActions
            plugin={data}
            canOpenWorkspace={canOpenWorkspace}
            refreshing={refreshing}
            actionPending={actionPending}
            onRefresh={onRefresh}
            performAction={performAction}
          />
        }
      />

      {actionError ? <p className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-xs text-danger-ink" role="alert">{actionError}</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-ink">{t("detail.runtime")}</h2></CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label={t("detail.lifecycle")}><PluginStateBadge state={data.state} /></DetailRow>
            <DetailRow label={t("detail.health")}><Status value={data.health.status} label={t(`health.${data.health.status}`)} /></DetailRow>
            <DetailRow label={t("detail.version")}><span className="font-mono text-xs">{data.version}</span></DetailRow>
            <DetailRow label={t("detail.category")}><span className="text-xs">{presentation.category}</span></DetailRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-ink">{t("detail.contract")}</h2></CardHeader>
          <CardContent className="space-y-4">
            {presentation.description ? <p className="text-xs leading-5 text-muted">{presentation.description}</p> : null}
            <div>
              <h3 className="text-xs font-medium text-muted">{t("detail.capabilities")}</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.capabilities.length
                  ? data.capabilities.map((item) => <Badge key={item}>{item}</Badge>)
                  : <span className="text-xs text-muted">{t("detail.noneDeclared")}</span>}
              </div>
            </div>
            <PluginDependenciesList dependencies={data.dependencies} />
          </CardContent>
        </Card>
      </section>

      <HealthDetailsCard details={data.health.details} />

      <Card>
        <CardHeader><h2 className="text-sm font-semibold text-ink">{t("detail.settingsSchema")}</h2></CardHeader>
        <CardContent>
          <pre className="max-w-full overflow-x-auto rounded-md border border-line bg-panel-inset p-3.5 font-mono text-xs leading-6 text-ink">{JSON.stringify(data.settings_schema, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}

export function PluginDetailPage() {
  const { t } = useLocale()
  const { pluginId = "" } = useParams<{ pluginId: string }>()
  const { data, error, loading, updatedAt, refresh, actionPending, actionError, performAction } = usePlugin(pluginId)
  const runtime = usePluginRuntime()

  if (loading && !data) return <StatePanel kind="loading" title={t("detail.loadingTitle")} />
  if (error || !data) return <StatePanel kind="error" title={t("detail.errorTitle")} description={[actionError, error || t("detail.notFound")].filter(Boolean).join(" ")} onRetry={refresh} />

  const handleAction = async (action: PluginAction) => {
    try {
      return await performAction(action)
    } finally {
      await runtime.refresh()
    }
  }

  const hasWorkspaceRoutes = (runtime.loadedPlugins[data.id]?.routes?.length ?? 0) > 0

  return (
    <PluginDetailContent
      plugin={data}
      hasWorkspaceRoutes={hasWorkspaceRoutes}
      updatedAt={updatedAt}
      refreshing={loading}
      actionPending={actionPending}
      actionError={actionError}
      onRefresh={async () => {
        await refresh()
        await runtime.refresh()
      }}
      performAction={handleAction}
    />
  )
}
