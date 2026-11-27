import { isDemo } from "@/config/buildMode"
import type { PluginView } from "@/types/plugin"

export const HOME_WORKSPACE_PLUGIN_ID = "infra_overview"

export function isHomeWorkspacePlugin(plugin: PluginView): boolean {
  return (
    !isDemo
    && plugin.id === HOME_WORKSPACE_PLUGIN_ID
    && plugin.state === "running"
    && plugin.frontend.ui_mode === "esm"
    && Boolean(plugin.frontend.entry_url)
  )
}
