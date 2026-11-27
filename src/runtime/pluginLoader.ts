import type { ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { getApiOrigin } from "@/runtime/sdkTransport"

export type ModuleImporter = (resolvedUrl: string) => Promise<unknown>

export const defaultModuleImporter: ModuleImporter = (resolvedUrl) =>
  import(/* @vite-ignore */ resolvedUrl)

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

  if (typeof candidate !== "object" || candidate === null) {
    throw new Error(`Plugin "${expectedPluginId}" module did not export a plugin descriptor.`)
  }

  const plugin = candidate as Partial<ReliaForgeFrontendPlugin>
  if (plugin.apiVersion !== "v1") {
    throw new Error(`Plugin "${expectedPluginId}" module apiVersion must be "v1".`)
  }
  if (plugin.id !== expectedPluginId) {
    throw new Error(`Plugin module id "${String(plugin.id)}" does not match "${expectedPluginId}".`)
  }
  return plugin as ReliaForgeFrontendPlugin
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
}

export async function loadPluginModule({
  pluginId,
  entryUrl,
  styleUrl,
  apiOrigin = getApiOrigin(),
  importModule = defaultModuleImporter,
}: LoadPluginModuleOptions): Promise<ReliaForgeFrontendPlugin> {
  const resolvedEntryUrl = resolvePluginAssetUrl(entryUrl, pluginId, apiOrigin)
  if (styleUrl) {
    const resolvedStyleUrl = resolvePluginAssetUrl(styleUrl, pluginId, apiOrigin)
    injectPluginStyle(pluginId, resolvedStyleUrl)
  } else {
    removePluginStyle(pluginId)
  }

  const loaded = await importModule(resolvedEntryUrl)
  return validatePluginModule(loaded, pluginId)
}
