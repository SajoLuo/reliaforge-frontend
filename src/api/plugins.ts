import type { ReliaForgeApi } from "@/api/adapter"
import { demoApi } from "@/api/demoAdapter"
import { httpApi } from "@/api/httpAdapter"
import { isDemo } from "@/config/buildMode"
import type {
  PlatformStatusResponse,
  PluginAction,
  PluginListResponse,
  PluginView,
} from "@/types/plugin"

const activeApi: ReliaForgeApi = isDemo ? demoApi : httpApi

export async function getPlatformStatus(signal?: AbortSignal): Promise<PlatformStatusResponse> {
  return activeApi.getPlatformStatus(signal)
}

export async function listPlugins(signal?: AbortSignal): Promise<PluginListResponse> {
  return activeApi.listPlugins(signal)
}

export async function getPlugin(pluginId: string, signal?: AbortSignal): Promise<PluginView> {
  return activeApi.getPlugin(pluginId, signal)
}

export async function runPluginAction(
  pluginId: string,
  action: PluginAction,
  signal?: AbortSignal,
): Promise<PluginView> {
  return activeApi.runPluginAction(pluginId, action, signal)
}
