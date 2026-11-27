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
import { listPlugins } from "@/api/plugins"
import { isDemo } from "@/config/buildMode"
import {
  defaultModuleImporter,
  loadPluginModule,
  removePluginStyle,
  type ModuleImporter,
} from "@/runtime/pluginLoader"
import { useTheme } from "@/theme/ThemeProvider"
import type { PluginView } from "@/types/plugin"

export interface RegisteredOverviewWidget extends PluginOverviewWidget {
  pluginId: string
}

export interface PluginRuntimeContextValue {
  plugins: PluginView[]
  loadedPlugins: Record<string, ReliaForgeFrontendPlugin>
  loadingPluginIds: string[]
  errors: Record<string, string>
  widgets: RegisteredOverviewWidget[]
  catalogLoading: boolean
  refresh: () => Promise<void>
}

const PluginRuntimeContext = createContext<PluginRuntimeContextValue>({
  plugins: [],
  loadedPlugins: {},
  loadingPluginIds: [],
  errors: {},
  widgets: [],
  catalogLoading: false,
  refresh: async () => undefined,
})

interface LoadedRecord {
  entryUrl: string
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

export function PluginRuntimeProvider({
  children,
  importModule = defaultModuleImporter,
  apiOrigin,
}: PluginRuntimeProviderProps) {
  const { registerThemes, unregisterPluginThemes, markCatalogSettled } = useTheme()
  const [plugins, setPlugins] = useState<PluginView[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [loadedMap, setLoadedMap] = useState<Record<string, LoadedRecord>>({})
  const [loadingIds, setLoadingIds] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const loadedRef = useRef<Record<string, LoadedRecord>>({})
  const generationRef = useRef(0)

  useEffect(() => {
    loadedRef.current = loadedMap
  }, [loadedMap])

  const syncPlugins = useCallback(async (catalog: PluginView[], generation: number) => {
    const activeIds = new Set(catalog.filter(shouldLoadEsmPlugin).map((plugin) => plugin.id))

    for (const existingId of Object.keys(loadedRef.current)) {
      if (!activeIds.has(existingId)) {
        removePluginStyle(existingId)
        unregisterPluginThemes(existingId)
      }
    }

    setLoadedMap((prev) => {
      const next: Record<string, LoadedRecord> = {}
      for (const [id, record] of Object.entries(prev)) {
        if (activeIds.has(id)) next[id] = record
      }
      loadedRef.current = next
      return next
    })

    const targets = catalog.filter((plugin) => {
      if (!shouldLoadEsmPlugin(plugin)) return false
      return loadedRef.current[plugin.id]?.entryUrl !== plugin.frontend.entry_url
    })

    if (targets.length === 0) {
      markCatalogSettled(true)
      return
    }

    setLoadingIds(targets.map((plugin) => plugin.id))
    const nextLoaded: Record<string, LoadedRecord> = {}
    const nextErrors: Record<string, string> = {}

    await Promise.all(targets.map(async (plugin) => {
      const entryUrl = plugin.frontend.entry_url
      if (!entryUrl) return
      try {
        const mod = await loadPluginModule({
          pluginId: plugin.id,
          entryUrl,
          styleUrl: plugin.frontend.style_url,
          apiOrigin,
          importModule,
        })
        if (generation !== generationRef.current) return
        nextLoaded[plugin.id] = { entryUrl, module: mod }
        if (mod.themes && mod.themes.length > 0) {
          registerThemes(plugin.id, mod.themes)
        } else {
          unregisterPluginThemes(plugin.id)
        }
      } catch (err) {
        if (generation !== generationRef.current) return
        removePluginStyle(plugin.id)
        unregisterPluginThemes(plugin.id)
        nextErrors[plugin.id] = err instanceof Error ? err.message : "Failed to load plugin UI."
      }
    }))

    if (generation !== generationRef.current) return
    setLoadedMap((prev) => {
      const merged = { ...prev, ...nextLoaded }
      loadedRef.current = merged
      return merged
    })
    setErrors(nextErrors)
    setLoadingIds([])
    markCatalogSettled(true)
  }, [apiOrigin, importModule, markCatalogSettled, registerThemes, unregisterPluginThemes])

  const refresh = useCallback(async () => {
    const generation = ++generationRef.current
    setCatalogLoading(true)
    const controller = new AbortController()
    try {
      const response = await listPlugins(controller.signal)
      if (generation !== generationRef.current) return
      setPlugins(response.plugins)
      await syncPlugins(response.plugins, generation)
    } catch {
      if (generation !== generationRef.current) return
      markCatalogSettled(true)
    } finally {
      if (generation === generationRef.current) setCatalogLoading(false)
    }
  }, [markCatalogSettled, syncPlugins])

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
    widgets,
    catalogLoading,
    refresh,
  }), [catalogLoading, errors, loadedPlugins, loadingIds, plugins, refresh, widgets])

  return (
    <PluginRuntimeContext.Provider value={value}>
      {children}
    </PluginRuntimeContext.Provider>
  )
}

export function usePluginRuntime(): PluginRuntimeContextValue {
  return useContext(PluginRuntimeContext)
}
