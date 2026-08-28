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
      className={cn("overflow-hidden rounded-lg border bg-panel", className)}
      aria-label={t("plugins.listLabel")}
      data-testid="plugin-list"
    >
      <div className="hidden grid-cols-[minmax(0,1.7fr)_8rem_minmax(0,1fr)_2.5rem] gap-4 border-b bg-canvas/60 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted md:grid">
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
