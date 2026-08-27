import { Activity, Boxes, CircleAlert, CircleCheck, RefreshCw, Square } from "lucide-react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginCard } from "@/components/plugins/PluginCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePlatformStatus, usePlugins } from "@/hooks/usePlugins"
import type { AsyncResource } from "@/hooks/useAsyncResource"

function isInitialLoad<T>(resource: AsyncResource<T>): boolean {
  return resource.loading && resource.data === null
}

function getOverviewSnapshot(status: ReturnType<typeof usePlatformStatus>, catalog: ReturnType<typeof usePlugins>) {
  if (!status.data || !catalog.data) return null
  return { status: status.data, catalog: catalog.data }
}

export function OverviewPage() {
  const status = usePlatformStatus()
  const catalog = usePlugins()
  const snapshot = getOverviewSnapshot(status, catalog)

  if (isInitialLoad(status) || isInitialLoad(catalog)) {
    return <StatePanel kind="loading" title="Reading platform state" description="ReliaForge is loading the current runtime and plugin catalog." />
  }

  if (status.error || catalog.error || !snapshot) {
    return (
      <StatePanel
        kind="error"
        title="Platform state is unavailable"
        description={status.error || catalog.error || "The API did not return a complete platform snapshot."}
        onRetry={async () => Promise.all([status.refresh(), catalog.refresh()]).then(() => undefined)}
      />
    )
  }

  const summary = snapshot.status.plugins
  const featured = snapshot.catalog.plugins.slice(0, 3)
  const metrics = [
    { label: "Runtime", value: snapshot.status.status, icon: Activity },
    { label: "Plugins", value: String(summary.total), icon: Boxes },
    { label: "Running", value: String(summary.running), icon: CircleCheck },
    { label: "Stopped", value: String(summary.stopped), icon: Square },
    { label: "Needs attention", value: String(summary.degraded + summary.error), icon: CircleAlert },
  ]

  return (
    <div className="space-y-9">
      <PageHeader
        eyebrow={`Runtime ${snapshot.status.version}`}
        title="Small plugins. Clear boundaries."
        description="ReliaForge provides one place to inspect plugin contracts, dependencies, health, and lifecycle state without bundling a fixed operations stack."
        actions={
          <Button variant="secondary" disabled={status.loading || catalog.loading} onClick={() => void Promise.all([status.refresh(), catalog.refresh()])}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Platform summary">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-1 text-2xl font-black capitalize">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Catalog</p>
            <h2 className="mt-2 text-2xl font-bold">Available plugins</h2>
          </div>
          <Link className="text-sm font-bold text-accent hover:underline" to="/plugins">View all</Link>
        </div>
        {featured.length === 0 ? (
          <StatePanel kind="empty" title="No plugins discovered" description="Add a plugin package to begin building your workspace." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)}
          </div>
        )}
      </section>
    </div>
  )
}
