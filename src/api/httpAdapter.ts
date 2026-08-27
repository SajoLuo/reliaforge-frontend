import type { ReliaForgeApi } from "@/api/adapter"
import { api } from "@/api/client"
import {
  parsePlatformStatusResponse,
  parsePluginListResponse,
  parsePluginView,
} from "@/api/contracts"

const PLUGIN_ACTION_TIMEOUT_MS = 310_000

export const httpApi: ReliaForgeApi = {
  async getPlatformStatus(signal) {
    const response = await api.get<unknown>("/status", { signal })
    return parsePlatformStatusResponse(response.data)
  },

  async listPlugins(signal) {
    const response = await api.get<unknown>("/plugins", { signal })
    return parsePluginListResponse(response.data)
  },

  async getPlugin(pluginId, signal) {
    const response = await api.get<unknown>(`/plugins/${encodeURIComponent(pluginId)}`, { signal })
    return parsePluginView(response.data)
  },

  async runPluginAction(pluginId, action, signal) {
    const path = `/plugins/${encodeURIComponent(pluginId)}/${encodeURIComponent(action)}`
    const response = await api.post<unknown>(path, undefined, {
      signal,
      timeout: PLUGIN_ACTION_TIMEOUT_MS,
    })
    return parsePluginView(response.data)
  },
}
