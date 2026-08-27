import { ArrowUpRight, Boxes } from "lucide-react"
import { Link } from "react-router-dom"
import { PluginStateBadge } from "@/components/plugins/PluginStateBadge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { PluginView } from "@/types/plugin"

export interface PluginCardProps {
  plugin: PluginView
}

export function PluginCard({ plugin }: PluginCardProps) {
  const detailRoute = `/plugins/${encodeURIComponent(plugin.id)}`
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5" data-testid="plugin-card">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
          <Boxes className="h-5 w-5" aria-hidden="true" />
        </div>
        <PluginStateBadge state={plugin.state} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{plugin.frontend.category || "Extension"}</p>
        <h2 className="mt-2 text-xl font-bold">{plugin.name}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted">{plugin.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>v{plugin.version}</Badge>
          {plugin.capabilities.slice(0, 2).map((capability) => <Badge key={capability}>{capability}</Badge>)}
          {plugin.capabilities.length > 2 ? <Badge>+{plugin.capabilities.length - 2} more</Badge> : null}
        </div>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline" to={detailRoute}>
          Inspect {plugin.name} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}
