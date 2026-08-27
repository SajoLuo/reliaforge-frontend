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

interface ActionDefinition {
  icon: LucideIcon
  label: string
  variant: "primary" | "secondary" | "danger"
}

const actionDefinitions: Record<PluginAction, ActionDefinition> = {
  start: { icon: Play, label: "Start", variant: "primary" },
  stop: { icon: Square, label: "Stop", variant: "danger" },
  restart: { icon: RefreshCw, label: "Restart", variant: "secondary" },
}

function healthTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "healthy") return "success"
  if (status === "degraded") return "warning"
  if (status === "error") return "danger"
  return "neutral"
}

export function PluginDetailPage() {
  const { pluginId = "" } = useParams<{ pluginId: string }>()
  const { data, error, loading, refresh, actionPending, actionError, performAction } = usePlugin(pluginId)

  if (loading && !data) return <StatePanel kind="loading" title="Loading plugin" description="Reading the manifest, health snapshot, and lifecycle state." />
  if (error || !data) return <StatePanel kind="error" title="Plugin unavailable" description={error || "The plugin was not found."} onRetry={refresh} />

  return (
    <PluginDetailContent
      plugin={data}
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
  refreshing: boolean
  actionPending: UsePluginReturn["actionPending"]
  actionError: UsePluginReturn["actionError"]
  onRefresh: UsePluginReturn["refresh"]
  performAction: UsePluginReturn["performAction"]
}

function PluginDetailContent({
  plugin: data,
  refreshing,
  actionPending,
  actionError,
  onRefresh,
  performAction,
}: PluginDetailContentProps) {
  return (
    <div className="space-y-8">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink" to="/plugins">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to catalog
      </Link>
      <PageHeader
        eyebrow={`${data.id} · API ${data.api_version}`}
        title={data.name}
        description={data.description}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={refreshing || actionPending !== null}
              aria-busy={refreshing}
              onClick={() => void onRefresh()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
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

      {actionError ? <p className="rounded-xl border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger-ink" role="alert">{actionError}</p> : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><h2 className="font-bold">Runtime</h2></CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Lifecycle"><PluginStateBadge state={data.state} /></DetailRow>
            <DetailRow label="Health"><Badge tone={healthTone(data.health.status)}>{data.health.status}</Badge></DetailRow>
            <DetailRow label="Version"><span className="font-mono text-sm">{data.version}</span></DetailRow>
            <DetailRow label="Category"><span>{data.frontend.category || "Extension"}</span></DetailRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-bold">Contract</h2></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Capabilities</h3>
              <div className="mt-2 flex flex-wrap gap-2">{data.capabilities.length ? data.capabilities.map((item) => <Badge key={item}>{item}</Badge>) : <span className="text-sm text-muted">None declared</span>}</div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Dependencies</h3>
              <ul className="mt-2 space-y-1 text-sm">{data.dependencies.length ? data.dependencies.map((item) => <li key={item.id}><span className="font-mono">{item.id}</span> <span className="text-muted">{item.version}</span></li>) : <li className="text-muted">No dependencies</li>}</ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><h2 className="font-bold">Settings schema</h2><p className="text-sm text-muted">Public configuration shape derived from the plugin&apos;s Python Settings class.</p></CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl bg-inverse p-4 text-xs leading-6 text-code-ink">{JSON.stringify(data.settings_schema, null, 2)}</pre>
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
  return actions.map((action) => {
    const { icon: Icon, label, variant } = actionDefinitions[action]
    return (
      <Button
        key={action}
        variant={variant}
        disabled={disabled || pending !== null}
        aria-busy={pending === action}
        onClick={() => {
          const needsConfirmation = action === "stop" || action === "restart"
          if (needsConfirmation && !window.confirm(`${label} this plugin?`)) return
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
  return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"><span className="text-sm text-muted">{label}</span>{children}</div>
}
