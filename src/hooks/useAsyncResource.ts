import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { apiErrorMessage } from "@/api/errors"

const DEFAULT_RESOURCE_KEY = ""
type ResourceKey = string

interface ResourceState<T> {
  key: ResourceKey
  data: T | null
  error: string | null
  loading: boolean
}

export interface AsyncResource<T> {
  data: T | null
  error: string | null
  loading: boolean
  refresh: () => Promise<void>
  replace: (data: T) => void
}

export function useAsyncResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  resourceKey: ResourceKey = DEFAULT_RESOURCE_KEY,
): AsyncResource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    key: resourceKey,
    data: null,
    error: null,
    loading: true,
  })
  const loaderRef = useRef(loader)
  const resourceKeyRef = useRef<ResourceKey>(resourceKey)
  const activeController = useRef<AbortController | null>(null)
  const mounted = useRef(false)
  const requestGeneration = useRef(0)

  useLayoutEffect(() => {
    loaderRef.current = loader
    resourceKeyRef.current = resourceKey
  }, [loader, resourceKey])

  const isCurrentRequest = useCallback((
    controller: AbortController,
    generation: number,
    requestKey: ResourceKey,
  ) => (
    mounted.current
    && !controller.signal.aborted
    && generation === requestGeneration.current
    && requestKey === resourceKeyRef.current
  ), [])

  const refresh = useCallback(async () => {
    const requestKey = resourceKeyRef.current
    const generation = requestGeneration.current + 1
    requestGeneration.current = generation
    activeController.current?.abort()
    const controller = new AbortController()
    activeController.current = controller
    if (mounted.current) {
      setState((previous) => ({
        key: requestKey,
        data: previous.key === requestKey ? previous.data : null,
        error: null,
        loading: true,
      }))
    }
    try {
      const result = await loaderRef.current(controller.signal)
      if (isCurrentRequest(controller, generation, requestKey)) {
        setState({ key: requestKey, data: result, error: null, loading: false })
      }
    } catch (requestError) {
      if (isCurrentRequest(controller, generation, requestKey)) {
        setState((previous) => ({
          key: requestKey,
          data: previous.key === requestKey ? previous.data : null,
          error: apiErrorMessage(requestError, "The request could not be completed."),
          loading: false,
        }))
      }
    } finally {
      if (activeController.current === controller) activeController.current = null
    }
  }, [isCurrentRequest])

  const replace = useCallback((data: T) => {
    const requestKey = resourceKeyRef.current
    requestGeneration.current += 1
    activeController.current?.abort()
    activeController.current = null
    if (mounted.current) {
      setState({ key: requestKey, data, error: null, loading: false })
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      requestGeneration.current += 1
      activeController.current?.abort()
      activeController.current = null
    }
  }, [])

  useEffect(() => {
    requestGeneration.current += 1
    activeController.current?.abort()
    activeController.current = null
    const initialRequest = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(initialRequest)
  }, [refresh, resourceKey])

  const isSettledKey = state.key === resourceKey
  return {
    data: isSettledKey ? state.data : null,
    error: isSettledKey ? state.error : null,
    loading: isSettledKey ? state.loading : true,
    refresh,
    replace,
  }
}
