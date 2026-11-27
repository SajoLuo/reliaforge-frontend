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

export type FrontendNavSection = "workspace" | "operations" | "platform"

export type FrontendUiMode = "none" | "esm"

export interface FrontendNavItem {
  label: string
  label_zh: string | null
  path: string
  icon: string | null
  order: number
  section: FrontendNavSection
}

export interface PluginFrontendMetadata {
  category: string | null
  ui_mode: FrontendUiMode
  nav: FrontendNavItem[]
  provides_themes: string[]
  entry_url: string | null
  style_url: string | null
}

export interface PluginHealth {
  status: HealthStatus
  details?: JsonObject | null
}

export interface PluginDependency {
  id: string
  version: string
  optional: boolean
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
