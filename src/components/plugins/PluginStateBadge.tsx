import { Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PluginState } from "@/types/plugin"
import { useLocale } from "@/i18n/useLocale"

export interface PluginStateBadgeProps {
  state: PluginState
  className?: string
}

export function PluginStateBadge({ state, className }: PluginStateBadgeProps) {
  const { t } = useLocale()
  const tone = state === "running" ? "success" : state === "error" ? "danger" : "neutral"
  return (
    <Badge tone={tone} className={className}>
      <Circle className="mr-1 h-1.5 w-1.5 fill-current" aria-hidden="true" />
      {t(`state.${state}`)}
    </Badge>
  )
}
