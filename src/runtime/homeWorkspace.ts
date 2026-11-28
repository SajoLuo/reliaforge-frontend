import { isDemo } from "@/config/buildMode"
import type { PluginView } from "@/types/plugin"

export const HOME_WORKSPACE_PLUGIN_ID = "infra_overview"

export function isHomeWorkspacePlugin(plugin: PluginView): boolean {
  return (
    plugin.id === HOME_WORKSPACE_PLUGIN_ID
    && plugin.state === "running"
    && plugin.frontend.ui_mode === "esm"
    && (isDemo || Boolean(plugin.frontend.entry_url))
  )
}
