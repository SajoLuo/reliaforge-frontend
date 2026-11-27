import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REQUIRED_PLUGIN_FIELDS = [
  "id",
  "name",
  "version",
  "description",
  "api_version",
  "state",
  "available_actions",
  "dependencies",
  "capabilities",
  "settings_schema",
  "frontend",
  "health",
]
const REQUIRED_FRONTEND_FIELDS = [
  "category",
  "ui_mode",
  "nav",
  "provides_themes",
  "entry_url",
  "style_url",
]
const REQUIRED_NAV_ITEM_FIELDS = ["label", "label_zh", "path", "icon", "order", "section"]
const ACTIONS = ["restart", "start", "stop"]
const UI_MODES = ["esm", "none"]

function resolveSchema(document, schema) {
  if (!schema || typeof schema !== "object") return schema
  const reference = schema.$ref
  if (typeof reference === "string") {
    const name = reference.split("/").at(-1)
    return name ? resolveSchema(document, document.components?.schemas?.[name]) : undefined
  }
  if (Array.isArray(schema.allOf) && schema.allOf.length === 1) {
    return resolveSchema(document, schema.allOf[0])
  }
  return schema
}

function endpointErrors(document) {
  const endpoints = [
    ["/api/v1/live", "get"],
    ["/api/v1/ready", "get"],
    ["/api/v1/status", "get"],
    ["/api/v1/plugins", "get"],
    ["/api/v1/plugins/{plugin_id}", "get"],
    ["/api/v1/plugins/{plugin_id}/start", "post"],
    ["/api/v1/plugins/{plugin_id}/stop", "post"],
    ["/api/v1/plugins/{plugin_id}/restart", "post"],
    ["/api/v1/plugins/{plugin_id}/ui/{asset_path}", "get"],
  ]
  return endpoints
    .filter(([route, method]) => document.paths?.[route]?.[method] === undefined)
    .map(([route, method]) => `missing endpoint: ${method.toUpperCase()} ${route}`)
}

function dependencyErrors(document, pluginView) {
  const depSchema = resolveSchema(document, pluginView.properties?.dependencies?.items)
  if (!depSchema?.properties?.optional) {
    return ["PluginDependency schema must declare optional"]
  }
  return []
}

function frontendErrors(document, pluginView) {
  const errors = []
  const frontendSchema = resolveSchema(document, pluginView.properties?.frontend)
  if (!frontendSchema?.properties) {
    return ["FrontendView schema is missing"]
  }
  for (const field of REQUIRED_FRONTEND_FIELDS) {
    if (!frontendSchema.properties[field]) {
      errors.push(`FrontendView missing field: ${field}`)
    }
  }
  const uiModeSchema = resolveSchema(document, frontendSchema.properties.ui_mode)
  const uiModes = [...(uiModeSchema?.enum ?? [])].sort()
  if (JSON.stringify(uiModes) !== JSON.stringify(UI_MODES)) {
    errors.push("FrontendView.ui_mode enum must contain esm and none")
  }
  const navItemSchema = resolveSchema(document, frontendSchema.properties.nav?.items)
  if (!navItemSchema?.properties) {
    errors.push("FrontendNavItem schema is missing")
  } else {
    for (const field of REQUIRED_NAV_ITEM_FIELDS) {
      if (!navItemSchema.properties[field]) {
        errors.push(`FrontendNavItem missing field: ${field}`)
      }
    }
  }
  return errors
}

export function validateApiContract(document) {
  const errors = endpointErrors(document)
  const pluginView = document.components?.schemas?.PluginView
  if (!pluginView) return [...errors, "missing schema: PluginView"]

  const required = new Set(pluginView.required ?? [])
  for (const field of REQUIRED_PLUGIN_FIELDS) {
    if (!required.has(field)) errors.push(`PluginView field is not required: ${field}`)
  }

  const actionItems = pluginView.properties?.available_actions?.items
  const actionSchema = resolveSchema(document, actionItems)
  const actualActions = [...(actionSchema?.enum ?? [])].sort()
  if (JSON.stringify(actualActions) !== JSON.stringify(ACTIONS)) {
    errors.push("PluginAction enum must contain restart, start, and stop")
  }

  errors.push(...dependencyErrors(document, pluginView))
  errors.push(...frontendErrors(document, pluginView))
  return errors
}

async function loadDocument(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source, { headers: { Accept: "application/json" } })
    if (!response.ok) throw new Error(`OpenAPI request failed with status ${response.status}`)
    return response.json()
  }
  return JSON.parse(await fs.readFile(source, "utf8"))
}

async function main() {
  const source = process.env.RELIAFORGE_OPENAPI_URL || process.argv[2] || "http://127.0.0.1:8000/api/v1/openapi.json"
  const errors = validateApiContract(await loadDocument(source))
  for (const error of errors) process.stderr.write(`contract-error\t${error}\n`)
  process.exitCode = errors.length ? 1 : 0
}

const invokedPath = process.argv[1] ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) : false
if (invokedPath) {
  main().catch((error) => {
    const errorType = error instanceof Error ? error.constructor.name : "UnknownError"
    process.stderr.write(`contract-check-error\t${errorType}\n`)
    process.exitCode = 2
  })
}
