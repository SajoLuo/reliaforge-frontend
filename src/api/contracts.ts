import type {
  HealthStatus,
  JsonObject,
  JsonValue,
  PlatformStatusResponse,
  PluginAction,
  PluginDependency,
  PluginFrontendMetadata,
  PluginHealth,
  PluginListResponse,
  PluginState,
  PluginSummary,
  PluginView,
} from "@/types/plugin"

function invalid(field: string): never {
  throw new Error(`Invalid API response: ${field}.`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) invalid(field)
  return value
}

function stringValue(value: unknown, field: string): string {
  if (typeof value !== "string") invalid(field)
  return value
}

function integer(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) invalid(field)
  return value
}

function pluginState(value: unknown): PluginState {
  if (
    value === "discovered"
    || value === "validated"
    || value === "initialized"
    || value === "running"
    || value === "stopped"
    || value === "error"
  ) return value
  return invalid("plugin.state")
}

function healthStatus(value: unknown): HealthStatus {
  if (
    value === "healthy"
    || value === "degraded"
    || value === "error"
    || value === "stopped"
  ) return value
  return invalid("plugin.health.status")
}

function pluginAction(value: unknown): PluginAction {
  if (value === "start" || value === "stop" || value === "restart") return value
  return invalid("plugin.available_actions")
}

function jsonValue(value: unknown, field: string): JsonValue {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
    || (typeof value === "number" && Number.isFinite(value))
  ) return value
  if (Array.isArray(value)) return value.map((item) => jsonValue(item, field))
  const source = record(value, field)
  const parsed: JsonObject = {}
  for (const [key, item] of Object.entries(source)) parsed[key] = jsonValue(item, field)
  return parsed
}

function jsonObject(value: unknown, field: string): JsonObject {
  const parsed = jsonValue(value, field)
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) invalid(field)
  return parsed
}

function dependency(value: unknown): PluginDependency {
  const source = record(value, "plugin.dependencies")
  return {
    id: stringValue(source.id, "plugin.dependencies.id"),
    version: stringValue(source.version, "plugin.dependencies.version"),
  }
}

function frontend(value: unknown): PluginFrontendMetadata {
  const source = record(value, "plugin.frontend")
  if (source.category === undefined) return {}
  if (source.category === null || typeof source.category === "string") {
    return { category: source.category }
  }
  return invalid("plugin.frontend.category")
}

function health(value: unknown): PluginHealth {
  const source = record(value, "plugin.health")
  const details = source.details
  return {
    status: healthStatus(source.status),
    ...(details === undefined
      ? {}
      : { details: details === null ? null : jsonObject(details, "plugin.health.details") }),
  }
}

export function parsePluginView(value: unknown): PluginView {
  const source = record(value, "plugin")
  if (source.api_version !== "v1") invalid("plugin.api_version")
  if (!Array.isArray(source.available_actions)) invalid("plugin.available_actions")
  if (!Array.isArray(source.dependencies)) invalid("plugin.dependencies")
  if (!Array.isArray(source.capabilities)) invalid("plugin.capabilities")

  return {
    id: stringValue(source.id, "plugin.id"),
    name: stringValue(source.name, "plugin.name"),
    version: stringValue(source.version, "plugin.version"),
    description: stringValue(source.description, "plugin.description"),
    api_version: source.api_version,
    state: pluginState(source.state),
    available_actions: source.available_actions.map(pluginAction),
    dependencies: source.dependencies.map(dependency),
    capabilities: source.capabilities.map((item) => stringValue(item, "plugin.capabilities")),
    settings_schema: jsonObject(source.settings_schema, "plugin.settings_schema"),
    frontend: frontend(source.frontend),
    health: health(source.health),
  }
}

export function parsePluginListResponse(value: unknown): PluginListResponse {
  const source = record(value, "plugins")
  if (!Array.isArray(source.plugins)) invalid("plugins")
  return { plugins: source.plugins.map(parsePluginView) }
}

function pluginSummary(value: unknown): PluginSummary {
  const source = record(value, "status.plugins")
  const summary = {
    total: integer(source.total, "status.plugins.total"),
    running: integer(source.running, "status.plugins.running"),
    degraded: integer(source.degraded, "status.plugins.degraded"),
    stopped: integer(source.stopped, "status.plugins.stopped"),
    error: integer(source.error, "status.plugins.error"),
  }
  if (summary.total !== summary.running + summary.degraded + summary.stopped + summary.error) {
    invalid("status.plugins.total")
  }
  return summary
}

export function parsePlatformStatusResponse(value: unknown): PlatformStatusResponse {
  const source = record(value, "status")
  if (source.status !== "healthy" && source.status !== "degraded") invalid("status.status")
  return {
    status: source.status,
    version: stringValue(source.version, "status.version"),
    plugins: pluginSummary(source.plugins),
  }
}
