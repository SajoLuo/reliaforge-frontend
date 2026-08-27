import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginCard } from "@/components/plugins/PluginCard"
import { Button } from "@/components/ui/button"
import { usePlugins } from "@/hooks/usePlugins"

export function PluginsPage() {
  const { data, error, loading, refresh } = usePlugins()

  if (loading && !data) return <StatePanel kind="loading" title="Discovering plugins" description="Reading manifests and current lifecycle state." />
  if (error) return <StatePanel kind="error" title="Plugin catalog unavailable" description={error} onRetry={refresh} />
  if (!data || data.plugins.length === 0) {
    return <StatePanel kind="empty" title="No plugins discovered" description="Create a plugin from the backend template and restart the development server." />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${data.plugins.length} discovered`}
        title="Plugin catalog"
        description="Every card is generated from the backend manifest. The interface contains no hard-coded business module registry."
        actions={<Button variant="secondary" disabled={loading} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</Button>}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.plugins.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)}
      </div>
    </div>
  )
}
