import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginCard } from "@/components/plugins/PluginCard"
import { Button } from "@/components/ui/button"
import { usePlugins } from "@/hooks/usePlugins"
import { useLocale } from "@/i18n/useLocale"

export function PluginsPage() {
  const { t } = useLocale()
  const { data, error, loading, refresh } = usePlugins()

  if (loading && !data) return <StatePanel kind="loading" title={t("plugins.loadingTitle")} description={t("plugins.loadingDescription")} />
  if (error) return <StatePanel kind="error" title={t("plugins.errorTitle")} description={error} onRetry={refresh} />
  if (!data || data.plugins.length === 0) {
    return <StatePanel kind="empty" title={t("plugins.emptyTitle")} description={t("plugins.emptyDescription")} />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("plugins.eyebrow", { count: data.plugins.length })}
        title={t("plugins.title")}
        description={t("plugins.description")}
        actions={<Button variant="secondary" disabled={loading} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" aria-hidden="true" /> {t("common.refresh")}</Button>}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.plugins.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)}
      </div>
    </div>
  )
}
