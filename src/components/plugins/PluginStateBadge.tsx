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
  return <Badge tone={tone} className={className}>{t(`state.${state}`)}</Badge>
}
