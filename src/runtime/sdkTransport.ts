import type { ApiFetchOptions } from "@reliaforge/plugin-sdk"
import { buildApiBaseUrl } from "@/api/client"

export class ApiFetchError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = "ApiFetchError"
    this.status = status
    this.body = body
  }
}

export function getApiBaseUrl(): string {
  return buildApiBaseUrl(import.meta.env.VITE_RELIAFORGE_API_URL)
}

export function getApiOrigin(): string {
  const base = getApiBaseUrl()
  if (/^https?:\/\//i.test(base)) {
    return new URL(base).origin
  }
  return window.location.origin
}

export function resolveApiUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`Invalid API path "${path}": path must start with a single "/".`)
  }
  const base = getApiBaseUrl()
  if (path === "/api/v1" || path.startsWith("/api/v1/")) {
    const root = base.replace(/\/api\/v1$/, "")
    return `${root}${path}`
  }
  return `${base}${path}`
}

function isRawBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string"
    || value instanceof FormData
    || value instanceof Blob
    || value instanceof URLSearchParams
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
  )
}

function buildRequestInit(options: ApiFetchOptions): RequestInit {
  const headers = new Headers({ Accept: "application/json", ...options.headers })
  let body: BodyInit | undefined
  if (options.body !== undefined) {
    if (isRawBodyInit(options.body)) {
      body = options.body
    } else {
      body = JSON.stringify(options.body)
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
    }
  }
  return {
    method: options.method ?? "GET",
    headers,
    body,
    signal: options.signal,
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return response.json()
  }
  const text = await response.text()
  return text || undefined
}

function extractErrorMessage(response: Response, payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail
    if (typeof detail === "string" && detail.trim()) return detail
  }
  if (typeof payload === "string" && payload.trim()) return payload
  return response.statusText || `HTTP ${response.status}`
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = resolveApiUrl(path)
  const response = await fetch(url, buildRequestInit(options))
  const payload = await parseResponseBody(response)
  if (!response.ok) {
    throw new ApiFetchError(extractErrorMessage(response, payload), response.status, payload)
  }
  return payload as T
}

export function createEventSource(path: string, init?: EventSourceInit): EventSource {
  return new EventSource(resolveApiUrl(path), init)
}

export function createWebSocketUrl(path: string): string {
  const resolved = resolveApiUrl(path)
  const baseHref = typeof window !== "undefined" ? window.location.href : "http://127.0.0.1/"
  const url = new URL(resolved, baseHref)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  return url.toString()
}
