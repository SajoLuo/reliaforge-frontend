import { ArrowUpRight, Boxes } from "lucide-react"
import { Link } from "react-router-dom"
import { PluginStateBadge } from "@/components/plugins/PluginStateBadge"
import { Badge } from "@/components/ui/badge"
import { pluginPresentation } from "@/i18n/pluginPresentation"
import { useLocale } from "@/i18n/useLocale"
import type { PluginView } from "@/types/plugin"

export interface PluginCardProps {
  plugin: PluginView
}

export function PluginCard({ plugin }: PluginCardProps) {
  const { pathFor, t } = useLocale()
  const presentation = pluginPresentation(plugin, t)
  const detailRoute = pathFor(`/plugins/${encodeURIComponent(plugin.id)}`)

  return (
    <article
      className="grid min-w-0 gap-4 border-b px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.7fr)_8rem_minmax(0,1fr)_2.5rem] md:items-center md:px-5 md:py-3"
      data-testid="plugin-card"
      role="listitem"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
          <Boxes className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">{presentation.category}</p>
          <h2 className="mt-1 truncate text-sm font-semibold tracking-tight">{presentation.name}</h2>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted">{presentation.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:block">
        <span className="text-xs font-medium text-muted md:sr-only">{t("plugins.columnStatus")}</span>
        <PluginStateBadge state={plugin.state} />
      </div>

      <div className="min-w-0">
        <span className="mb-2 block text-xs font-medium text-muted md:sr-only">{t("plugins.columnCapabilities")}</span>
        <div className="flex flex-wrap gap-1.5">
          {plugin.capabilities.slice(0, 2).map((capability) => <Badge key={capability}>{capability}</Badge>)}
          {plugin.capabilities.length > 2 ? <Badge>{t("common.more", { count: plugin.capabilities.length - 2 })}</Badge> : null}
        </div>
      </div>

      <Link
        className="inline-flex min-h-9 items-center justify-center gap-2 justify-self-start rounded-md border px-3 text-xs font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:h-9 md:w-9 md:justify-self-end md:p-0"
        to={detailRoute}
      >
        <span className="md:sr-only">{t("common.inspect", { name: presentation.name })}</span>
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  )
}
