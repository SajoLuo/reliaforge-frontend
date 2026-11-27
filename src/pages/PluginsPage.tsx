import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginList } from "@/components/plugins/PluginList"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePlugins } from "@/hooks/usePlugins"
import { useLocale } from "@/i18n/useLocale"

export function PluginsPage() {
  const { t } = useLocale()
  const { data, error, loading, refresh } = usePlugins()

  if (loading && !data) return <StatePanel kind="loading" title={t("plugins.loadingTitle")} />
  if (error) return <StatePanel kind="error" title={t("plugins.errorTitle")} description={error} onRetry={refresh} />
  if (!data || data.plugins.length === 0) {
    return <StatePanel kind="empty" title={t("plugins.emptyTitle")} />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("plugins.title")}
        meta={<Badge className="tabular-nums">{t("plugins.count", { count: data.plugins.length })}</Badge>}
        actions={
          <Button variant="secondary" size="small" disabled={loading} onClick={() => void refresh()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t("common.refresh")}
          </Button>
        }
      />
      <PluginList plugins={data.plugins} />
    </div>
  )
}
