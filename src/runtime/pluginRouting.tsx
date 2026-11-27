/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext } from "react"
import { Link } from "react-router-dom"
import type { PluginLinkProps } from "@reliaforge/plugin-sdk"
import { useLocale } from "@/i18n/useLocale"

export const PluginRouteContext = createContext<string | null>(null)

function splitPathSuffix(target: string): { pathPart: string; suffix: string } {
  const match = target.match(/[?#]/)
  if (!match || match.index === undefined) {
    return { pathPart: target, suffix: "" }
  }
  return {
    pathPart: target.slice(0, match.index),
    suffix: target.slice(match.index),
  }
}

export function buildPluginPath(
  pluginId: string,
  subPath: string,
  pathFor: (path: string) => string,
): string {
  const { pathPart, suffix } = splitPathSuffix(subPath.trim())
  const trimmed = pathPart.replace(/^\/+|\/+$/g, "")
  const semantic = trimmed
    ? `/p/${encodeURIComponent(pluginId)}/${trimmed}`
    : `/p/${encodeURIComponent(pluginId)}`
  return `${pathFor(semantic)}${suffix}`
}

export function usePluginPath(pluginId?: string): (subPath?: string) => string {
  const activePluginId = useContext(PluginRouteContext)
  const { pathFor } = useLocale()
  const resolvedId = pluginId ?? activePluginId

  return useCallback(
    (subPath = "") => {
      if (!resolvedId) {
        throw new Error("usePluginPath requires a pluginId or active plugin route context.")
      }
      return buildPluginPath(resolvedId, subPath, pathFor)
    },
    [pathFor, resolvedId],
  )
}

export function PluginLink({ to, pluginId, ...props }: PluginLinkProps) {
  const toPluginPath = usePluginPath(pluginId)
  return <Link to={toPluginPath(to)} {...props} />
}
