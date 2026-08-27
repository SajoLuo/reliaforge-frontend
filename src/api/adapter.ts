import type {
  PlatformStatusResponse,
  PluginAction,
  PluginListResponse,
  PluginView,
} from "@/types/plugin"

export interface ReliaForgeApi {
  getPlatformStatus: (signal?: AbortSignal) => Promise<PlatformStatusResponse>
  listPlugins: (signal?: AbortSignal) => Promise<PluginListResponse>
  getPlugin: (pluginId: string, signal?: AbortSignal) => Promise<PluginView>
  runPluginAction: (
    pluginId: string,
    action: PluginAction,
    signal?: AbortSignal,
  ) => Promise<PluginView>
}
