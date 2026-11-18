import { ArrowLeft, Play, RefreshCw, Square, type LucideIcon } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginStateBadge } from "@/components/plugins/PluginStateBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { usePlugin, type UsePluginReturn } from "@/hooks/usePlugins"
import type { PluginAction, PluginView } from "@/types/plugin"
import { useLocale } from "@/i18n/useLocale"
import { pluginPresentation } from "@/i18n/pluginPresentation"

interface ActionDefinition {
  icon: LucideIcon
  variant: "primary" | "secondary" | "danger"
}

const actionDefinitions: Record<PluginAction, ActionDefinition> = {
  start: { icon: Play, variant: "primary" },
  stop: { icon: Square, variant: "danger" },
  restart: { icon: RefreshCw, variant: "secondary" },
}

function healthTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "healthy") return "success"
  if (status === "degraded") return "warning"
  if (status === "error") return "danger"
  return "neutral"
}

export function PluginDetailPage() {
  const { t } = useLocale()
  const { pluginId = "" } = useParams<{ pluginId: string }>()
  const { data, error, loading, updatedAt, refresh, actionPending, actionError, performAction } = usePlugin(pluginId)

  if (loading && !data) return <StatePanel kind="loading" title={t("detail.loadingTitle")} description={t("detail.loadingDescription")} />
  if (error || !data) return <StatePanel kind="error" title={t("detail.errorTitle")} description={[actionError, error || t("detail.notFound")].filter(Boolean).join(" ")} onRetry={refresh} />

  return (
    <PluginDetailContent
      plugin={data}
      updatedAt={updatedAt}
      refreshing={loading}
      actionPending={actionPending}
      actionError={actionError}
      onRefresh={refresh}
      performAction={performAction}
    />
  )
}

interface PluginDetailContentProps {
  plugin: PluginView
  updatedAt: number | null
  refreshing: boolean
  actionPending: UsePluginReturn["actionPending"]
  actionError: UsePluginReturn["actionError"]
  onRefresh: UsePluginReturn["refresh"]
  performAction: UsePluginReturn["performAction"]
}

function PluginDetailContent({
  plugin: data,
  updatedAt,
  refreshing,
  actionPending,
  actionError,
  onRefresh,
  performAction,
}: PluginDetailContentProps) {
  const { locale, pathFor, t } = useLocale()
  const presentation = pluginPresentation(data, t)
  return (
    <div className="space-y-10">
      <Link className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2" to={pathFor("/plugins")}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {t("detail.back")}
      </Link>
      <PageHeader
        eyebrow={`${data.id} · API ${data.api_version}`}
        title={presentation.name}
        description={presentation.description}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={refreshing || actionPending !== null}
              aria-busy={refreshing}
              onClick={() => void onRefresh()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t("common.refresh")}
            </Button>
            {data.available_actions.length ? (
              <LifecycleActions
                actions={data.available_actions}
                pending={actionPending}
                disabled={refreshing}
                onAction={performAction}
              />
            ) : null}
          </>
        }
      />

      {actionError ? <p className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger-ink" role="alert">{actionError}</p> : null}
      {updatedAt !== null ? <p className="text-sm text-muted">{t("detail.lastChecked", { time: new Date(updatedAt).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US") })}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("detail.runtime")}</h2></CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t("detail.lifecycle")}><PluginStateBadge state={data.state} /></DetailRow>
            <DetailRow label={t("detail.health")}><Badge tone={healthTone(data.health.status)}>{t(`health.${data.health.status}`)}</Badge></DetailRow>
            <DetailRow label={t("detail.version")}><span className="font-mono text-sm">{data.version}</span></DetailRow>
            <DetailRow label={t("detail.category")}><span>{presentation.category}</span></DetailRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("detail.contract")}</h2></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t("detail.capabilities")}</h3>
              <div className="mt-2 flex flex-wrap gap-2">{data.capabilities.length ? data.capabilities.map((item) => <Badge key={item}>{item}</Badge>) : <span className="text-sm text-muted">{t("detail.noneDeclared")}</span>}</div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t("detail.dependencies")}</h3>
              <ul className="mt-2 space-y-1 text-sm">{data.dependencies.length ? data.dependencies.map((item) => <li key={item.id}><span className="font-mono">{item.id}</span> <span className="text-muted">{item.version}</span></li>) : <li className="text-muted">{t("detail.noDependencies")}</li>}</ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {data.health.details && Object.keys(data.health.details).length ? (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold tracking-tight">{t("detail.healthDetails")}</h2></CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {Object.entries(data.health.details).map(([key, value]) => (
                <div key={key} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
                  <dt className="break-words font-medium">{key}</dt>
                  <dd className="break-words text-muted">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><h2 className="text-sm font-semibold tracking-tight">{t("detail.settingsSchema")}</h2><p className="text-sm text-muted">{t("detail.settingsDescription")}</p></CardHeader>
        <CardContent>
          <pre className="max-w-full overflow-x-auto rounded-md border border-inverse-muted/20 bg-inverse p-4 font-mono text-xs leading-6 text-code-ink">{JSON.stringify(data.settings_schema, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  )
}

interface LifecycleActionsProps {
  actions: PluginAction[]
  pending: PluginAction | null
  disabled: boolean
  onAction: (action: PluginAction) => Promise<unknown>
}

function LifecycleActions({ actions, pending, disabled, onAction }: LifecycleActionsProps) {
  const { t } = useLocale()
  return actions.map((action) => {
    const { icon: Icon, variant } = actionDefinitions[action]
    const label = t(`action.${action}`)
    return (
      <Button
        key={action}
        variant={variant}
        disabled={disabled || pending !== null}
        aria-busy={pending === action}
        onClick={() => {
          const needsConfirmation = action === "stop" || action === "restart"
          if (needsConfirmation && !window.confirm(t("action.confirm", { action: label }))) return
          void onAction(action)
        }}
      >
        <Icon className="h-4 w-4" aria-hidden="true" /> {label}
      </Button>
    )
  })
}

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"><span className="text-sm text-muted">{label}</span><span className="text-sm font-medium">{children}</span></div>
}
