import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ApiFetchError,
  apiFetch,
  createEventSource,
  createWebSocketUrl,
  resolveApiUrl,
} from "@/runtime/sdkTransport"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("sdkTransport", () => {
  it("normalizes both plugin-relative and /api/v1-prefixed paths", () => {
    expect(resolveApiUrl("/plugins/proxmox/overview")).toBe("/api/v1/plugins/proxmox/overview")
    expect(resolveApiUrl("/api/v1/plugins/proxmox/overview")).toBe("/api/v1/plugins/proxmox/overview")
    expect(resolveApiUrl("/api/v1")).toBe("/api/v1")
    expect(() => resolveApiUrl("plugins/no-leading-slash")).toThrow('must start with a single "/"')
    expect(() => resolveApiUrl("//evil.example.com/api")).toThrow('must start with a single "/"')
  })

  it("performs JSON and 204 requests via apiFetch and surfaces detail on HTTP errors", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "audit_unavailable" }), {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "content-type": "application/json" },
        }),
      )
    vi.stubGlobal("fetch", fetchMock)

    const result = await apiFetch<{ ok: boolean }>("/plugins/ops_audit/summary", {
      method: "POST",
      body: { limit: 10 },
    })
    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/plugins/ops_audit/summary",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ limit: 10 }),
      }),
    )

    const empty = await apiFetch("/plugins/demo/ping")
    expect(empty).toBeUndefined()

    await expect(apiFetch("/plugins/proxmox/actions/execute", { method: "POST", body: "raw" }))
      .rejects.toMatchObject({
        name: "ApiFetchError",
        status: 503,
        message: "audit_unavailable",
      })
    expect(new ApiFetchError("err", 400)).toBeInstanceOf(Error)
  })

  it("builds EventSource and WebSocket URLs", () => {
    const FakeEventSource = vi.fn(function (this: { url: string }, url: string) {
      this.url = url
    })
    vi.stubGlobal("EventSource", FakeEventSource)

    createEventSource("/api/v1/plugins/kubernetes/pods/default/web/logs/stream")
    expect(FakeEventSource).toHaveBeenCalledWith(
      "/api/v1/plugins/kubernetes/pods/default/web/logs/stream",
      undefined,
    )

    const wsUrl = createWebSocketUrl("/plugins/proxmox/ws/nodes/pve-01/lxc/101/terminal")
    expect(wsUrl).toMatch(/^wss?:\/\/.*\/api\/v1\/plugins\/proxmox\/ws\/nodes\/pve-01\/lxc\/101\/terminal$/)
  })

  it("aborts apiFetch requests that exceed timeoutMs", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new Error("aborted")))
        }),
      ),
    )

    const pending = apiFetch("/plugins/proxmox/overview", { timeoutMs: 250 })
    const assertion = expect(pending).rejects.toMatchObject({ name: "TimeoutError" })
    await vi.advanceTimersByTimeAsync(250)
    await assertion
    vi.useRealTimers()
  })
})
