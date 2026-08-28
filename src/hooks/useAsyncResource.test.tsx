import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, useNavigate } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { useAsyncResource } from "@/hooks/useAsyncResource"
import { LocaleProvider } from "@/i18n/LocaleProvider"

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((fulfill, fail) => {
    resolve = fulfill
    reject = fail
  })
  return { promise, resolve, reject }
}

function ChineseWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/zh/"]}>
      <LocaleProvider>{children}</LocaleProvider>
    </MemoryRouter>
  )
}

function EnglishWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <LocaleProvider>{children}</LocaleProvider>
    </MemoryRouter>
  )
}

describe("useAsyncResource", () => {
  it("loads data and exposes a settled state", async () => {
    const loader = vi.fn().mockResolvedValue("ready")
    const { result } = renderHook(() => useAsyncResource(loader))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.data).toBe("ready"))
    expect(result.current).toMatchObject({ error: null, loading: false })
  })

  it("aborts the previous request and only commits the newest response", async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const signals: AbortSignal[] = []
    const loader = vi.fn((signal: AbortSignal) => {
      signals.push(signal)
      return signals.length === 1 ? first.promise : second.promise
    })
    const { result } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1))

    let refresh!: Promise<void>
    act(() => {
      refresh = result.current.refresh()
    })
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2))
    expect(signals[0].aborted).toBe(true)

    second.resolve("newest")
    await act(async () => refresh)
    first.resolve("stale")
    await act(async () => first.promise)

    expect(result.current.data).toBe("newest")
    expect(result.current.loading).toBe(false)
  })

  it("ignores a stale rejection after a newer request succeeds", async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const loader = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())

    let refresh!: Promise<void>
    act(() => {
      refresh = result.current.refresh()
    })
    second.resolve("current")
    await act(async () => refresh)
    first.reject(new Error("stale failure"))
    await act(async () => first.promise.catch(() => undefined))

    expect(result.current).toMatchObject({ data: "current", error: null, loading: false })
  })

  it("replaces data locally and prevents an in-flight response from overwriting it", async () => {
    const request = deferred<string>()
    let signal: AbortSignal | undefined
    const loader = vi.fn((requestSignal: AbortSignal) => {
      signal = requestSignal
      return request.promise
    })
    const { result } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())

    act(() => result.current.replace("committed"))

    expect(signal?.aborted).toBe(true)
    expect(result.current).toMatchObject({ data: "committed", error: null, loading: false })

    request.resolve("stale")
    await act(async () => request.promise)
    expect(result.current.data).toBe("committed")
  })

  it("uses an explicit key without looping when the loader is inline", async () => {
    const load = vi.fn().mockResolvedValue("ready")
    const { result, rerender } = renderHook(
      ({ keyValue }) => useAsyncResource((signal) => load(keyValue, signal), keyValue),
      { initialProps: { keyValue: "stable" } },
    )
    await waitFor(() => expect(result.current.data).toBe("ready"))
    rerender({ keyValue: "stable" })
    await act(async () => Promise.resolve())

    expect(load).toHaveBeenCalledOnce()
  })

  it("hides data from the previous key before the next request settles", async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const load = vi.fn((keyValue: string) => keyValue === "first" ? first.promise : second.promise)
    const { result, rerender } = renderHook(
      ({ keyValue }) => useAsyncResource(() => load(keyValue), keyValue),
      { initialProps: { keyValue: "first" } },
    )
    await waitFor(() => expect(load).toHaveBeenCalledWith("first"))
    first.resolve("first data")
    await waitFor(() => expect(result.current.data).toBe("first data"))

    rerender({ keyValue: "second" })
    expect(result.current).toMatchObject({ data: null, error: null, loading: true })
    second.resolve("second data")
    await waitFor(() => expect(result.current.data).toBe("second data"))
  })

  it("aborts in-flight work when the consumer unmounts", async () => {
    const request = deferred<string>()
    let signal: AbortSignal | undefined
    const loader = vi.fn((requestSignal: AbortSignal) => {
      signal = requestSignal
      return request.promise
    })
    const { unmount } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())

    unmount()
    expect(signal?.aborted).toBe(true)
    request.resolve("ignored")
    await request.promise
  })

  it("surfaces backend problem details", async () => {
    const loader = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "Catalog is unavailable." } },
    })
    const { result } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(result.current.error).toBe("Catalog is unavailable."))
    expect(result.current.loading).toBe(false)
  })

  it("localizes client-generated authorization errors", async () => {
    const loader = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: {} },
    })
    const { result } = renderHook(() => useAsyncResource(loader), { wrapper: ChineseWrapper })

    await waitFor(() => expect(result.current.error).toBe("需要先登录。"))
  })

  it("uses the current locale without refetching when the URL locale changes", async () => {
    const request = deferred<string>()
    const loader = vi.fn().mockReturnValue(request.promise)
    const { result } = renderHook(() => ({
      resource: useAsyncResource(loader),
      navigate: useNavigate(),
    }), { wrapper: EnglishWrapper })
    await waitFor(() => expect(loader).toHaveBeenCalledOnce())

    act(() => result.current.navigate("/zh/"))
    await waitFor(() => expect(document.documentElement).toHaveAttribute("lang", "zh-CN"))
    expect(loader).toHaveBeenCalledOnce()

    request.reject({ isAxiosError: true, response: { status: 401, data: {} } })
    await act(async () => request.promise.catch(() => undefined))
    expect(result.current.resource.error).toBe("需要先登录。")
  })

  it("retries after a failed request", async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error("First request failed"))
      .mockResolvedValueOnce("recovered")
    const { result } = renderHook(() => useAsyncResource(loader))
    await waitFor(() => expect(result.current.error).toBe("First request failed"))

    await act(async () => result.current.refresh())

    expect(result.current).toMatchObject({ data: "recovered", error: null, loading: false })
  })
})
