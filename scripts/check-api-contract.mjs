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
const ACTIONS = ["restart", "start", "stop"]

function resolveSchema(document, schema) {
  const reference = schema?.$ref
  if (typeof reference !== "string") return schema
  const name = reference.split("/").at(-1)
  return name ? document.components?.schemas?.[name] : undefined
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
  ]
  return endpoints
    .filter(([route, method]) => document.paths?.[route]?.[method] === undefined)
    .map(([route, method]) => `missing endpoint: ${method.toUpperCase()} ${route}`)
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
