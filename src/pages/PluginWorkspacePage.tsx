import type { ReactNode } from "react"
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom"
import type { ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { StatePanel } from "@/components/common/StatePanel"
import { HOME_WORKSPACE_PLUGIN_ID, isHomeWorkspacePlugin } from "@/runtime/homeWorkspace"
import { PluginErrorBoundary } from "@/components/plugins/PluginErrorBoundary"
import { isDemo } from "@/config/buildMode"
import { usePlugin } from "@/hooks/usePlugins"
import type { Translator } from "@/i18n/types"
import { useLocale } from "@/i18n/useLocale"
import { OverviewPage } from "@/pages/OverviewPage"
import { usePluginRuntime } from "@/runtime/PluginRuntimeProvider"
import { buildPluginPath, PluginRouteContext } from "@/runtime/pluginRouting"
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
  plugin,
  loadedModule,
  detailLink,
}: {
  plugin: PluginView
  loadedModule: ReliaForgeFrontendPlugin
  detailLink: ReactNode
}) {
  const { pathFor, t } = useLocale()
  const routes = loadedModule.routes ?? []
  if (routes.length === 0) {
    return (
      <StatePanel
        kind="empty"
        title={t("workspace.notFoundTitle")}
        description={t("workspace.noUiDescription", { name: plugin.name })}
        action={detailLink}
      />
    )
  }
  const fallbackTarget = buildPluginPath(
    plugin.id,
    routes.find((route) => route.path.replace(/^\/+/, "") === "")?.path ?? routes[0].path,
    pathFor,
  )

  return (
    <div data-rf-plugin={plugin.id}>
      <PluginErrorBoundary pluginId={plugin.id}>
        <PluginRouteContext.Provider value={plugin.id}>
          <Routes>
            {routes.map((route) => {
              const Element = route.element
              const trimmed = route.path.replace(/^\/+/, "")
              if (trimmed === "") {
                return <Route key="__root__" index element={<Element pluginId={plugin.id} />} />
              }
              return <Route key={route.path} path={trimmed} element={<Element pluginId={plugin.id} />} />
            })}
            <Route path="*" element={<Navigate to={fallbackTarget} replace />} />
          </Routes>
        </PluginRouteContext.Provider>
      </PluginErrorBoundary>
    </div>
  )
}

function renderRuntimePendingOrError(
  plugin: PluginView,
  detailLink: ReactNode,
  runtime: ReturnType<typeof usePluginRuntime>,
  t: Translator,
): ReactNode {
  const unavailable = renderUnavailableWorkspace(plugin, detailLink, t)
  if (unavailable) return unavailable

  const loadedModule = runtime.loadedPlugins[plugin.id]
  const loadError = runtime.errors[plugin.id] ?? (!loadedModule ? runtime.catalogError : null)
  if (loadError) {
    return <StatePanel kind="error" title={t("workspace.loadErrorTitle")} description={loadError} onRetry={runtime.refresh} />
  }
  if (!loadedModule) {
    return <StatePanel kind="loading" title={t("workspace.loadingTitle")} />
  }
  return <PluginRoutesView plugin={plugin} loadedModule={loadedModule} detailLink={detailLink} />
}

export function HomePage() {
  const { pathFor, t } = useLocale()
  const runtime = usePluginRuntime()

  if (isDemo) {
    return <OverviewPage mode="overview" />
  }

  if (runtime.catalogLoading && runtime.plugins.length === 0) {
    return <StatePanel kind="loading" title={t("overview.loadingTitle")} />
  }

  const homePlugin = runtime.plugins.find((plugin) => plugin.id === HOME_WORKSPACE_PLUGIN_ID)
  if (!homePlugin || !isHomeWorkspacePlugin(homePlugin)) {
    return <OverviewPage mode="overview" />
  }

  const loadedModule = runtime.loadedPlugins[homePlugin.id]
  const loadError = runtime.errors[homePlugin.id]
  if (loadError) {
    return (
      <StatePanel
        kind="error"
        title={t("workspace.loadErrorTitle")}
        description={loadError}
        onRetry={runtime.refresh}
        action={
          <Link
            className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-panel px-3 text-xs font-medium text-ink transition-colors hover:bg-neutral-soft"
            to={pathFor("/platform")}
          >
            {t("workspace.openPlatform")}
          </Link>
        }
      />
    )
  }

  if (!loadedModule) {
    return <StatePanel kind="loading" title={t("workspace.loadingTitle")} />
  }

  const rootRoute = loadedModule.routes?.find((route) => route.path.replace(/^\/+/, "") === "")
  if (!rootRoute) {
    return <OverviewPage mode="overview" />
  }

  const RootElement = rootRoute.element
  return (
    <div data-rf-plugin={homePlugin.id}>
      <PluginErrorBoundary pluginId={homePlugin.id}>
        <PluginRouteContext.Provider value={homePlugin.id}>
          <RootElement pluginId={homePlugin.id} />
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
    return <StatePanel kind="loading" title={t("workspace.loadingTitle")} />
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
      className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-panel px-3 text-xs font-medium text-ink transition-colors hover:bg-neutral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      to={pathFor(`/plugins/${encodeURIComponent(plugin.id)}`)}
    >
      {t("workspace.demoInspectPlugin")}
    </Link>
  )

  return renderRuntimePendingOrError(plugin, detailLink, runtime, t)
}
