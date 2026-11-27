import { PluginCard } from "@/components/plugins/PluginCard"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import type { PluginView } from "@/types/plugin"

export interface PluginListProps {
  plugins: PluginView[]
  className?: string
}

export function PluginList({ plugins, className }: PluginListProps) {
  const { t } = useLocale()

  return (
    <section
      className={cn("overflow-hidden rounded-lg border border-line bg-panel shadow-panel", className)}
      aria-label={t("plugins.listLabel")}
      data-testid="plugin-list"
    >
      <div className="hidden grid-cols-[minmax(0,1.7fr)_7.5rem_minmax(0,1fr)_2.25rem] gap-3 border-b border-line bg-panel-inset px-4 py-2 text-xs font-medium text-muted md:grid">
        <span>{t("plugins.columnPlugin")}</span>
        <span>{t("plugins.columnStatus")}</span>
        <span>{t("plugins.columnCapabilities")}</span>
        <span className="sr-only">{t("plugins.columnInspect")}</span>
      </div>
      <div role="list">
        {plugins.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} />)}
      </div>
    </section>
  )
}
