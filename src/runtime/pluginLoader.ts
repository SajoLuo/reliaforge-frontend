import type { ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { getApiOrigin } from "@/runtime/sdkTransport"

export type ModuleImporter = (resolvedUrl: string) => Promise<unknown>

export const defaultModuleImporter: ModuleImporter = (resolvedUrl) =>
  import(/* @vite-ignore */ resolvedUrl)

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isRenderableComponent(value: unknown): boolean {
  return typeof value === "function" || (typeof value === "object" && value !== null && "$$typeof" in value)
}

function validateRoutes(routes: unknown, pluginId: string): void {
  if (routes === undefined) return
  if (!Array.isArray(routes)) {
    throw new Error(`Plugin "${pluginId}" module routes must be an array.`)
  }
  for (const route of routes) {
    if (!isPlainRecord(route) || typeof route.path !== "string" || !isRenderableComponent(route.element)) {
      throw new Error(`Plugin "${pluginId}" declared an invalid route entry.`)
    }
  }
}

function validateOverviewWidgets(widgets: unknown, pluginId: string): void {
  if (widgets === undefined) return
  if (!Array.isArray(widgets)) {
    throw new Error(`Plugin "${pluginId}" module overviewWidgets must be an array.`)
  }
  for (const widget of widgets) {
    if (
      !isPlainRecord(widget)
      || typeof widget.id !== "string"
      || !widget.id.trim()
      || typeof widget.title !== "string"
      || !isRenderableComponent(widget.component)
    ) {
      throw new Error(`Plugin "${pluginId}" declared an invalid overview widget.`)
    }
  }
}

const META_STRING_FIELDS = ["name", "nameZh", "description", "descriptionZh"] as const

function validateMeta(meta: unknown, pluginId: string): void {
  if (meta === undefined) return
  if (!isPlainRecord(meta)) {
    throw new Error(`Plugin "${pluginId}" module meta must be an object.`)
  }
  for (const field of META_STRING_FIELDS) {
    if (meta[field] !== undefined && typeof meta[field] !== "string") {
      throw new Error(`Plugin "${pluginId}" module meta.${field} must be a string.`)
    }
  }
}

export function resolvePluginAssetUrl(
  rawUrl: string,
  pluginId: string,
  apiOrigin: string = getApiOrigin(),
): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    throw new Error(`Plugin "${pluginId}" asset URL is empty.`)
  }
  const parsed = new URL(trimmed, apiOrigin)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Plugin "${pluginId}" asset URL uses unsupported protocol: ${parsed.protocol}`)
  }
  if (parsed.origin !== apiOrigin) {
    throw new Error(`Plugin "${pluginId}" asset URL must match the backend API origin.`)
  }
  const expectedPrefix = `/api/v1/plugins/${encodeURIComponent(pluginId)}/ui/`
  if (!parsed.pathname.startsWith(expectedPrefix)) {
    throw new Error(`Plugin "${pluginId}" asset path must reside under ${expectedPrefix}.`)
  }
  return parsed.toString()
}

export function validatePluginModule(
  rawModule: unknown,
  expectedPluginId: string,
): ReliaForgeFrontendPlugin {
  const candidate = (
    typeof rawModule === "object"
    && rawModule !== null
    && "default" in rawModule
    && (rawModule as { default?: unknown }).default !== undefined
  )
    ? (rawModule as { default: unknown }).default
    : rawModule

  if (!isPlainRecord(candidate)) {
    throw new Error(`Plugin "${expectedPluginId}" module did not export a plugin descriptor.`)
  }

  if (candidate.apiVersion !== "v1") {
    throw new Error(`Plugin "${expectedPluginId}" module apiVersion must be "v1".`)
  }
  if (candidate.id !== expectedPluginId) {
    throw new Error(`Plugin module id "${String(candidate.id)}" does not match "${expectedPluginId}".`)
  }

  validateMeta(candidate.meta, expectedPluginId)
  validateRoutes(candidate.routes, expectedPluginId)
  validateOverviewWidgets(candidate.overviewWidgets, expectedPluginId)
  return candidate as unknown as ReliaForgeFrontendPlugin
}

export function injectPluginStyle(pluginId: string, styleUrl: string): void {
  const selector = `link[data-rf-plugin-style="${CSS.escape(pluginId)}"]`
  const existing = document.head.querySelector<HTMLLinkElement>(selector)
  if (existing) {
    if (existing.href !== styleUrl) existing.href = styleUrl
    return
  }
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = styleUrl
  link.setAttribute("data-rf-plugin-style", pluginId)
  document.head.appendChild(link)
}

export function removePluginStyle(pluginId: string): void {
  const selector = `link[data-rf-plugin-style="${CSS.escape(pluginId)}"]`
  document.head.querySelectorAll(selector).forEach((node) => node.remove())
}

export interface LoadPluginModuleOptions {
  pluginId: string
  entryUrl: string
  styleUrl: string | null
  apiOrigin?: string
  importModule?: ModuleImporter
  retryAttempt?: number
}

function appendRetryParam(url: string, retryAttempt?: number): string {
  if (!retryAttempt) return url
  const parsed = new URL(url)
  parsed.searchParams.set("retry", String(retryAttempt))
  return parsed.toString()
}

export async function loadPluginModule({
  pluginId,
  entryUrl,
  styleUrl,
  apiOrigin = getApiOrigin(),
  importModule = defaultModuleImporter,
  retryAttempt,
}: LoadPluginModuleOptions): Promise<ReliaForgeFrontendPlugin> {
  const resolvedEntryUrl = appendRetryParam(
    resolvePluginAssetUrl(entryUrl, pluginId, apiOrigin),
    retryAttempt,
  )
  if (styleUrl) {
    const resolvedStyleUrl = resolvePluginAssetUrl(styleUrl, pluginId, apiOrigin)
    injectPluginStyle(pluginId, resolvedStyleUrl)
  } else {
    removePluginStyle(pluginId)
  }

  const loaded = await importModule(resolvedEntryUrl)
  return validatePluginModule(loaded, pluginId)
}
