import { api } from "@/api/client"
import {
  parsePlatformStatusResponse,
  parsePluginListResponse,
  parsePluginView,
} from "@/api/contracts"
import type {
  PlatformStatusResponse,
  PluginAction,
  PluginListResponse,
  PluginView,
} from "@/types/plugin"

const PLUGIN_ACTION_TIMEOUT_MS = 310_000

export async function getPlatformStatus(signal?: AbortSignal): Promise<PlatformStatusResponse> {
  const response = await api.get<unknown>("/status", { signal })
  return parsePlatformStatusResponse(response.data)
}

export async function listPlugins(signal?: AbortSignal): Promise<PluginListResponse> {
  const response = await api.get<unknown>("/plugins", { signal })
  return parsePluginListResponse(response.data)
}

export async function getPlugin(pluginId: string, signal?: AbortSignal): Promise<PluginView> {
  const response = await api.get<unknown>(`/plugins/${encodeURIComponent(pluginId)}`, { signal })
  return parsePluginView(response.data)
}

export async function runPluginAction(
  pluginId: string,
  action: PluginAction,
  signal?: AbortSignal,
): Promise<PluginView> {
  const path = `/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(action)}`
  const response = await api.post<unknown>(path, undefined, {
    signal,
    timeout: PLUGIN_ACTION_TIMEOUT_MS,
  })
  return parsePluginView(response.data)
}
