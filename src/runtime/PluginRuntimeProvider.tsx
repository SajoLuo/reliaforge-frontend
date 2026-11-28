/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { PluginOverviewWidget, ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { apiErrorMessage } from "@/api/errors"
import { listPlugins } from "@/api/plugins"
import { isDemo } from "@/config/buildMode"
import { useLocale } from "@/i18n/useLocale"
import {
  defaultModuleImporter,
  loadPluginModule,
  removePluginStyle,
  type ModuleImporter,
} from "@/runtime/pluginLoader"
import type { PluginView } from "@/types/plugin"

export interface RegisteredOverviewWidget extends PluginOverviewWidget {
  pluginId: string
}

export interface PluginRuntimeContextValue {
  plugins: PluginView[]
  loadedPlugins: Record<string, ReliaForgeFrontendPlugin>
  loadingPluginIds: string[]
  errors: Record<string, string>
  catalogError: string | null
  widgets: RegisteredOverviewWidget[]
  catalogLoading: boolean
  refresh: () => Promise<void>
}

const PluginRuntimeContext = createContext<PluginRuntimeContextValue>({
  plugins: [],
  loadedPlugins: {},
  loadingPluginIds: [],
  errors: {},
  catalogError: null,
  widgets: [],
  catalogLoading: false,
  refresh: async () => undefined,
})

interface LoadedRecord {
  entryUrl: string
  styleUrl: string | null
  module: ReliaForgeFrontendPlugin
}

export interface PluginRuntimeProviderProps {
  children: ReactNode
  importModule?: ModuleImporter
  apiOrigin?: string
}

function shouldLoadEsmPlugin(plugin: PluginView): boolean {
  return (
    !isDemo
    && plugin.state === "running"
    && plugin.frontend.ui_mode === "esm"
    && plugin.frontend.entry_url !== null
  )
}

function needsModuleReload(existing: LoadedRecord | undefined, plugin: PluginView): boolean {
  if (!existing) return true
  return existing.entryUrl !== plugin.frontend.entry_url || existing.styleUrl !== plugin.frontend.style_url
}

interface LoadTargetContext {
  plugin: PluginView
  generation: number
  apiOrigin?: string
  importModule: ModuleImporter
  retryAttempt: number
  isCurrentGeneration: () => boolean
  isStillActive: (pluginId: string) => boolean
  nextLoaded: Record<string, LoadedRecord>
  nextErrors: Record<string, string>
}

async function loadPluginTarget(ctx: LoadTargetContext): Promise<void> {
  const { plugin } = ctx
  const entryUrl = plugin.frontend.entry_url
  if (!entryUrl) return

  try {
    const mod = await loadPluginModule({
      pluginId: plugin.id,
      entryUrl,
      styleUrl: plugin.frontend.style_url,
      apiOrigin: ctx.apiOrigin,
      importModule: ctx.importModule,
      retryAttempt: ctx.retryAttempt,
    })
    if (!ctx.isCurrentGeneration() || !ctx.isStillActive(plugin.id)) {
      if (!ctx.isStillActive(plugin.id)) {
        removePluginStyle(plugin.id)
      }
      return
    }
    ctx.nextLoaded[plugin.id] = { entryUrl, styleUrl: plugin.frontend.style_url, module: mod }
  } catch (err) {
    if (!ctx.isCurrentGeneration()) {
      if (!ctx.isStillActive(plugin.id)) removePluginStyle(plugin.id)
      return
    }
    removePluginStyle(plugin.id)
    ctx.nextErrors[plugin.id] = err instanceof Error ? err.message : "Failed to load plugin UI."
  }
}

async function loadBuiltinDemoRecords(catalog: PluginView[]): Promise<{
  activeIds: Set<string>
  records: Record<string, LoadedRecord>
}> {
  const { DEMO_FRONTEND_PLUGINS } = await import("@/demo/demoPlugins")
  const records: Record<string, LoadedRecord> = {}
  const activeIds = new Set<string>()
  for (const plugin of catalog) {
    if (plugin.state !== "running" || plugin.frontend.ui_mode !== "esm") continue
    const demoModule = DEMO_FRONTEND_PLUGINS[plugin.id]
    if (!demoModule) continue
    activeIds.add(plugin.id)
    records[plugin.id] = {
      entryUrl: `demo://builtin/${plugin.id}`,
      styleUrl: null,
      module: demoModule,
    }
  }
  return { activeIds, records }
}

export function PluginRuntimeProvider({
  children,
  importModule = defaultModuleImporter,
  apiOrigin,
}: PluginRuntimeProviderProps) {
  const { t } = useLocale()
  const [plugins, setPlugins] = useState<PluginView[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [loadedMap, setLoadedMap] = useState<Record<string, LoadedRecord>>({})
  const [loadingIds, setLoadingIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const loadedRef = useRef<Record<string, LoadedRecord>>({})
  const errorsRef = useRef<Record<string, string>>({})
  const retryCountsRef = useRef<Record<string, number>>({})
  const activeIdsRef = useRef<Set<string>>(new Set())
  const generationRef = useRef(0)
  const tRef = useRef(t)

  useEffect(() => {
    loadedRef.current = loadedMap
    errorsRef.current = errors
    tRef.current = t
  }, [errors, loadedMap, t])

  const syncPlugins = useCallback(async (catalog: PluginView[], generation: number) => {
    if (isDemo) {
      const { activeIds, records } = await loadBuiltinDemoRecords(catalog)
      if (generation !== generationRef.current) return
      activeIdsRef.current = activeIds
      loadedRef.current = records
      setLoadedMap(records)
      setErrors({})
      errorsRef.current = {}
      setLoadingIds([])
      return
    }

    const activeIds = new Set(catalog.filter(shouldLoadEsmPlugin).map((plugin) => plugin.id))
    activeIdsRef.current = activeIds

    for (const existingId of Object.keys(loadedRef.current)) {
      if (!activeIds.has(existingId)) {
        removePluginStyle(existingId)
      }
    }

    const targets = catalog.filter(
      (plugin) => shouldLoadEsmPlugin(plugin) && needsModuleReload(loadedRef.current[plugin.id], plugin),
    )
    const targetIds = new Set(targets.map((plugin) => plugin.id))

    setLoadedMap((prev) => {
      const next: Record<string, LoadedRecord> = {}
      for (const [id, record] of Object.entries(prev)) {
        if (activeIds.has(id) && !targetIds.has(id)) next[id] = record
      }
      loadedRef.current = next
      return next
    })

    if (targets.length === 0) {
      setErrors((prev) => {
        const retained: Record<string, string> = {}
        for (const [id, message] of Object.entries(prev)) {
          if (activeIds.has(id)) retained[id] = message
        }
        return retained
      })
      return
    }

    setLoadingIds(targets.map((plugin) => plugin.id))
    const nextLoaded: Record<string, LoadedRecord> = {}
    const nextErrors: Record<string, string> = {}

    await Promise.all(
      targets.map((plugin) => {
        const retryAttempt = errorsRef.current[plugin.id]
          ? (retryCountsRef.current[plugin.id] ?? 0) + 1
          : 0
        if (retryAttempt > 0) retryCountsRef.current[plugin.id] = retryAttempt
        return loadPluginTarget({
          plugin,
          generation,
          apiOrigin,
          importModule,
          retryAttempt,
          isCurrentGeneration: () => generation === generationRef.current,
          isStillActive: (id) => activeIdsRef.current.has(id),
          nextLoaded,
          nextErrors,
        })
      }),
    )

    if (generation !== generationRef.current) return
    setLoadedMap((prev) => {
      const merged = { ...prev, ...nextLoaded }
      for (const failedId of Object.keys(nextErrors)) {
        delete merged[failedId]
      }
      loadedRef.current = merged
      return merged
    })
    setErrors(nextErrors)
    errorsRef.current = nextErrors
    setLoadingIds([])
  }, [apiOrigin, importModule])

  const refresh = useCallback(async () => {
    const generation = ++generationRef.current
    setCatalogLoading(true)
    setCatalogError(null)
    const controller = new AbortController()
    try {
      const response = await listPlugins(controller.signal)
      if (generation !== generationRef.current) return
      setPlugins(response.plugins)
      await syncPlugins(response.plugins, generation)
    } catch (err) {
      if (generation !== generationRef.current) return
      const translate = tRef.current
      setCatalogError(
        apiErrorMessage(err, translate("common.requestFailed"), {
          authenticationRequired: translate("error.authenticationRequired"),
          permissionDenied: translate("error.permissionDenied"),
        }),
      )
    } finally {
      if (generation === generationRef.current) setCatalogLoading(false)
    }
  }, [syncPlugins])

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => {
      window.clearTimeout(timer)
      generationRef.current += 1
    }
  }, [refresh])

  const loadedPlugins = useMemo(() => {
    const result: Record<string, ReliaForgeFrontendPlugin> = {}
    for (const [id, entry] of Object.entries(loadedMap)) {
      result[id] = entry.module
    }
    return result
  }, [loadedMap])

  const widgets = useMemo<RegisteredOverviewWidget[]>(() => {
    const collected: RegisteredOverviewWidget[] = []
    for (const [pluginId, mod] of Object.entries(loadedPlugins)) {
      for (const widget of mod.overviewWidgets ?? []) {
        collected.push({ ...widget, pluginId })
      }
    }
    return collected.sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
  }, [loadedPlugins])

  const value = useMemo<PluginRuntimeContextValue>(() => ({
    plugins,
    loadedPlugins,
    loadingPluginIds: loadingIds,
    errors,
    catalogError,
    widgets,
    catalogLoading,
    refresh,
  }), [catalogError, catalogLoading, errors, loadedPlugins, loadingIds, plugins, refresh, widgets])

  return (
    <PluginRuntimeContext.Provider value={value}>
      {children}
    </PluginRuntimeContext.Provider>
  )
}

export function usePluginRuntime(): PluginRuntimeContextValue {
  return useContext(PluginRuntimeContext)
}
