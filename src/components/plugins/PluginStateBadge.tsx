import { Badge } from "@/components/ui/badge"
import type { PluginState } from "@/types/plugin"

export interface PluginStateBadgeProps {
  state: PluginState
  className?: string
}

export function PluginStateBadge({ state, className }: PluginStateBadgeProps) {
  const tone = state === "running" ? "success" : state === "error" ? "danger" : "neutral"
  return <Badge tone={tone} className={className}>{state}</Badge>
}
