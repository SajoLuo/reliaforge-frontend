import { Status } from "@/components/ops/Status"
import { useLocale } from "@/i18n/useLocale"
import type { PluginState } from "@/types/plugin"

export interface PluginStateBadgeProps {
  state: PluginState
  className?: string
}

export function PluginStateBadge({ state, className }: PluginStateBadgeProps) {
  const { t } = useLocale()
  const tone = state === "running" ? "success" : state === "error" ? "danger" : "neutral"
  return <Status value={state} label={t(`state.${state}`)} tone={tone} className={className} />
}
