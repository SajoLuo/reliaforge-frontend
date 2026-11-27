import { ArrowUpRight, Boxes } from "lucide-react"
import { Link } from "react-router-dom"
import { PluginStateBadge } from "@/components/plugins/PluginStateBadge"
import { Badge } from "@/components/ui/badge"
import { pluginPresentation } from "@/i18n/pluginPresentation"
import { useLocale } from "@/i18n/useLocale"
import { usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import type { PluginView } from "@/types/plugin"

export interface PluginCardProps {
  plugin: PluginView
}

export function PluginCard({ plugin }: PluginCardProps) {
  const { locale, pathFor, t } = useLocale()
  const { loadedPlugins } = usePluginRuntime()
  const presentation = pluginPresentation(plugin, t, {
    locale,
    meta: loadedPlugins[plugin.id]?.meta,
  })
  const detailRoute = pathFor(`/plugins/${encodeURIComponent(plugin.id)}`)

  return (
    <article
      className="grid min-w-0 gap-3 border-b border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.7fr)_7.5rem_minmax(0,1fr)_2.25rem] md:items-center md:px-4 md:py-2.5"
      data-testid="plugin-card"
      role="listitem"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-panel-inset text-muted">
          <Boxes className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-ink">{presentation.name}</h2>
            <span className="shrink-0 text-[11px] text-muted">{presentation.category}</span>
          </div>
          {presentation.description ? (
            <p className="mt-0.5 truncate text-xs text-muted" title={presentation.description}>
              {presentation.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 md:block">
        <span className="text-xs font-medium text-muted md:sr-only">{t("plugins.columnStatus")}</span>
        <PluginStateBadge state={plugin.state} />
      </div>

      <div className="min-w-0">
        <span className="mb-1.5 block text-xs font-medium text-muted md:sr-only">{t("plugins.columnCapabilities")}</span>
        <div className="flex flex-wrap gap-1.5">
          {plugin.capabilities.slice(0, 2).map((capability) => <Badge key={capability}>{capability}</Badge>)}
          {plugin.capabilities.length > 2 ? <Badge>{t("common.more", { count: plugin.capabilities.length - 2 })}</Badge> : null}
        </div>
      </div>

      <Link
        className="inline-flex h-8 items-center justify-center gap-1.5 justify-self-start rounded-md border border-line bg-panel px-2.5 text-xs font-medium text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:w-8 md:justify-self-end md:p-0"
        to={detailRoute}
      >
        <span className="md:sr-only">{t("common.inspect", { name: presentation.name })}</span>
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  )
}
