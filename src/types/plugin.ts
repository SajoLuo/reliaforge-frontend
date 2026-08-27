export type PluginState =
  | "discovered"
  | "validated"
  | "initialized"
  | "running"
  | "stopped"
  | "error"

export type HealthStatus = "healthy" | "degraded" | "error" | "stopped"

export type PluginAction = "start" | "stop" | "restart"

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

export interface JsonObject {
  [key: string]: JsonValue
}

export interface PluginFrontendMetadata {
  category?: string | null
}

export interface PluginHealth {
  status: HealthStatus
  details?: JsonObject | null
}

export interface PluginDependency {
  id: string
  version: string
}

export interface PluginView {
  id: string
  name: string
  version: string
  description: string
  api_version: "v1"
  state: PluginState
  available_actions: PluginAction[]
  dependencies: PluginDependency[]
  capabilities: string[]
  settings_schema: JsonObject
  frontend: PluginFrontendMetadata
  health: PluginHealth
}

export interface PluginListResponse {
  plugins: PluginView[]
}

export interface PluginSummary {
  total: number
  running: number
  degraded: number
  stopped: number
  error: number
}

export interface PlatformStatusResponse {
  status: "healthy" | "degraded"
  version: string
  plugins: PluginSummary
}
