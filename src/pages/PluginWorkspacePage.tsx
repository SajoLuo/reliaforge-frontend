import type { ReactNode } from "react"
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom"
import type { ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { StatePanel } from "@/components/common/StatePanel"
import { PluginErrorBoundary } from "@/components/plugins/PluginErrorBoundary"
import { isDemo } from "@/config/buildMode"
import { usePlugin } from "@/hooks/usePlugins"
import type { Translator } from "@/i18n/types"
import { useLocale } from "@/i18n/useLocale"
import { usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import { PluginRouteContext } from "@/runtime/pluginRouting"
import type { PluginView } from "@/types/plugin"

function renderUnavailableWorkspace(
  plugin: PluginView,
  detailLink: ReactNode,
  t: Translator,
): ReactNode | null {
  if (isDemo) {
    return (
      <StatePanel
        kind="empty"
        title={t("workspace.demoTitle")}
        description={t("workspace.demoDescription")}
        action={detailLink}
      />
    )
  }
  if (plugin.state !== "running") {
    return (
      <StatePanel
        kind="empty"
        title={t("workspace.notRunningTitle")}
        description={t("workspace.notRunningDescription", { name: plugin.name })}
        action={detailLink}
      />
    )
  }
  if (plugin.frontend.ui_mode !== "esm" || !plugin.frontend.entry_url) {
    return (
      <StatePanel
        kind="empty"
        title={t("workspace.notFoundTitle")}
        description={t("workspace.noUiDescription", { name: plugin.name })}
        action={detailLink}
      />
    )
  }
  return null
}

function PluginRoutesView({
  pluginId,
  loadedModule,
}: {
  pluginId: string
  loadedModule: ReliaForgeFrontendPlugin
}) {
  const { pathFor } = useLocale()
  const routes = loadedModule.routes ?? []
  return (
    <div data-rf-plugin={pluginId}>
      <PluginErrorBoundary pluginId={pluginId}>
        <PluginRouteContext.Provider value={pluginId}>
          <Routes>
            {routes.map((route) => {
              const Element = route.element
              const trimmed = route.path.replace(/^\/+/, "")
              if (trimmed === "") {
                return <Route key="__root__" index element={<Element pluginId={pluginId} />} />
              }
              return <Route key={route.path} path={trimmed} element={<Element pluginId={pluginId} />} />
            })}
            <Route path="*" element={<Navigate to={pathFor(`/p/${encodeURIComponent(pluginId)}`)} replace />} />
          </Routes>
        </PluginRouteContext.Provider>
      </PluginErrorBoundary>
    </div>
  )
}

export function PluginWorkspacePage() {
  const { pluginId = "" } = useParams<{ pluginId: string }>()
  const { pathFor, t } = useLocale()
  const { data: plugin, error, loading, refresh } = usePlugin(pluginId)
  const runtime = usePluginRuntime()

  if (loading && !plugin) {
    return <StatePanel kind="loading" title={t("workspace.loadingTitle")} description={t("workspace.loadingDescription")} />
  }

  if (error || !plugin) {
    return (
      <StatePanel
        kind="error"
        title={t("workspace.notFoundTitle")}
        description={error || t("workspace.notFoundDescription", { pluginId })}
        onRetry={refresh}
      />
    )
  }

  const detailLink = (
    <Link
      className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-panel px-4 text-sm font-medium text-ink transition-colors hover:bg-neutral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      to={pathFor(`/plugins/${encodeURIComponent(plugin.id)}`)}
    >
      {t("workspace.demoInspectPlugin")}
    </Link>
  )

  const unavailable = renderUnavailableWorkspace(plugin, detailLink, t)
  if (unavailable) return unavailable

  const loadError = runtime.errors[plugin.id]
  if (loadError) {
    return <StatePanel kind="error" title={t("workspace.loadErrorTitle")} description={loadError} onRetry={runtime.refresh} />
  }

  const loadedModule = runtime.loadedPlugins[plugin.id]
  if (!loadedModule) {
    return <StatePanel kind="loading" title={t("workspace.loadingTitle")} description={t("workspace.loadingDescription")} />
  }

  return <PluginRoutesView pluginId={plugin.id} loadedModule={loadedModule} />
}
