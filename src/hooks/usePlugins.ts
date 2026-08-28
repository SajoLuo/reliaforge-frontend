import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { apiErrorMessage } from "@/api/errors"
import { getPlatformStatus, getPlugin, listPlugins, runPluginAction } from "@/api/plugins"
import { useAsyncResource, type AsyncResource } from "@/hooks/useAsyncResource"
import type { PlatformStatusResponse, PluginAction, PluginListResponse, PluginView } from "@/types/plugin"
import { useLocale } from "@/i18n/useLocale"

const loadStatus = (signal: AbortSignal): Promise<PlatformStatusResponse> => getPlatformStatus(signal)
const loadPlugins = (signal: AbortSignal): Promise<PluginListResponse> => listPlugins(signal)

export function usePlatformStatus(): AsyncResource<PlatformStatusResponse> {
  return useAsyncResource(loadStatus)
}

export function usePlugins(): AsyncResource<PluginListResponse> {
  return useAsyncResource(loadPlugins)
}

export interface UsePluginReturn extends AsyncResource<PluginView> {
  actionPending: PluginAction | null
  actionError: string | null
  performAction: (action: PluginAction) => Promise<PluginView | null>
}

interface ActionState {
  routeIdentity: PluginLoader
  pending: PluginAction | null
  error: ActionFailure | null
}

interface ActionFailure {
  cause: unknown
}

type PluginLoader = (signal: AbortSignal) => Promise<PluginView>

interface ActiveAction {
  routeIdentity: PluginLoader
  controller: AbortController
}

export function usePlugin(pluginId: string): UsePluginReturn {
  const { t } = useLocale()
  const loader = useCallback((signal: AbortSignal) => getPlugin(pluginId, signal), [pluginId])
  const resource = useAsyncResource(loader, pluginId)
  const { refresh: refreshResource, replace: replaceResource } = resource
  const [actionState, setActionState] = useState<ActionState>({
    routeIdentity: loader,
    pending: null,
    error: null,
  })
  const mounted = useRef(false)
  const activeAction = useRef<ActiveAction | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      activeAction.current?.controller.abort()
      activeAction.current = null
    }
  }, [])

  useLayoutEffect(() => {
    if (activeAction.current?.routeIdentity !== loader) {
      activeAction.current?.controller.abort()
      activeAction.current = null
    }
  }, [loader])

  const refresh = useCallback(async () => {
    setActionState((previous) => previous.routeIdentity === loader
      ? { ...previous, error: null }
      : previous)
    await refreshResource()
  }, [loader, refreshResource])

  const performAction = useCallback(
    async (action: PluginAction): Promise<PluginView | null> => {
      if (activeAction.current !== null) return null
      const controller = new AbortController()
      activeAction.current = { routeIdentity: loader, controller }
      setActionState({ routeIdentity: loader, pending: action, error: null })
      const isCurrentAction = () => (
        mounted.current
        && !controller.signal.aborted
        && activeAction.current?.routeIdentity === loader
        && activeAction.current.controller === controller
      )
      try {
        const updated = await runPluginAction(pluginId, action, controller.signal)
        if (!isCurrentAction()) return null
        replaceResource(updated)
        return updated
      } catch (requestError) {
        if (isCurrentAction()) {
          setActionState({
            routeIdentity: loader,
            pending: action,
            error: { cause: requestError },
          })
        }
        return null
      } finally {
        if (activeAction.current?.controller === controller) {
          activeAction.current = null
          if (mounted.current) {
            setActionState((previous) => previous.routeIdentity === loader
              ? { ...previous, pending: null }
              : previous)
          }
        }
      }
    },
    [loader, pluginId, replaceResource],
  )

  const actionPending = actionState.routeIdentity === loader ? actionState.pending : null
  const actionError = actionState.routeIdentity === loader && actionState.error
    ? apiErrorMessage(actionState.error.cause, t("action.failed"), {
        authenticationRequired: t("error.authenticationRequired"),
        permissionDenied: t("error.permissionDenied"),
      })
    : null
  return { ...resource, refresh, actionPending, actionError, performAction }
}
