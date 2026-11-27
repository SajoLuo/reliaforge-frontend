import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { Terminal } from "@xterm/xterm"
import "@xterm/xterm/css/xterm.css"
import { Terminal as TerminalIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type {
  TerminalConnectionOptions,
  TerminalConnectionStatus,
  TerminalPaneProps,
} from "@reliaforge/plugin-sdk"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import { createWebSocketUrl } from "@/runtime/sdkTransport"

interface ControlMessage {
  type?: unknown
  code?: unknown
  reason?: unknown
}

const PING_INTERVAL_MS = 30_000

const statusTones: Record<TerminalConnectionStatus, NonNullable<BadgeProps["tone"]>> = {
  idle: "neutral",
  connecting: "warning",
  connected: "success",
  exited: "neutral",
  closed: "neutral",
  error: "danger",
}

function resolveSocketUrl(wsUrl: string): string {
  if (/^wss?:\/\//i.test(wsUrl)) return wsUrl
  return createWebSocketUrl(wsUrl)
}

function sendJson(socket: WebSocket, payload: Record<string, unknown>) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function encodeBinaryString(data: string): Uint8Array {
  const bytes = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i += 1) {
    bytes[i] = data.charCodeAt(i) & 0xff
  }
  return bytes
}

function parseControlMessage(raw: string): ControlMessage | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === "object" && parsed !== null ? (parsed as ControlMessage) : null
  } catch {
    return null
  }
}

interface SessionCallbacks {
  isDisposed: () => boolean
  onStatus: (next: TerminalConnectionStatus) => void
  onExit: (code: number) => void
  onError: (reason: string) => void
  fallbackError: () => string
}

function handleTextControl(
  raw: string,
  callbacks: SessionCallbacks,
): boolean {
  const msg = parseControlMessage(raw)
  if (!msg) return false
  if (msg.type === "exit") {
    callbacks.onExit(typeof msg.code === "number" ? msg.code : 0)
    return true
  }
  if (msg.type === "error") {
    callbacks.onError(typeof msg.reason === "string" ? msg.reason : callbacks.fallbackError())
    return true
  }
  return false
}

function handleSocketPayload(
  data: unknown,
  terminal: Terminal,
  callbacks: SessionCallbacks,
): boolean {
  if (data instanceof ArrayBuffer) {
    terminal.write(new Uint8Array(data))
    return false
  }
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    void data.arrayBuffer().then((buffer) => {
      if (!callbacks.isDisposed()) terminal.write(new Uint8Array(buffer))
    })
    return false
  }
  if (typeof data !== "string") return false
  return handleTextControl(data, callbacks)
}

function attachSocketHandlers(
  socket: WebSocket,
  terminal: Terminal,
  fitAddon: FitAddon,
  callbacks: SessionCallbacks,
) {
  let settled = false
  socket.onopen = () => {
    if (callbacks.isDisposed()) return
    callbacks.onStatus("connected")
    fitAddon.fit()
    sendJson(socket, { type: "resize", cols: terminal.cols, rows: terminal.rows })
  }
  socket.onmessage = (event) => {
    if (callbacks.isDisposed()) return
    if (handleSocketPayload(event.data, terminal, callbacks)) settled = true
  }
  socket.onerror = () => {
    if (callbacks.isDisposed() || settled) return
    settled = true
    callbacks.onError("WebSocket connection error")
  }
  socket.onclose = () => {
    if (callbacks.isDisposed() || settled) return
    callbacks.onStatus("closed")
  }
}

function createBoundedResizeObserver(container: HTMLElement, fitAddon: FitAddon): ResizeObserver | null {
  if (typeof ResizeObserver === "undefined") return null
  let lastWidth = container.clientWidth
  let lastHeight = container.clientHeight
  const observer = new ResizeObserver(() => {
    const width = container.clientWidth
    const height = container.clientHeight
    if (width <= 0 || height <= 0) return
    if (width === lastWidth && height === lastHeight) return
    lastWidth = width
    lastHeight = height
    fitAddon.fit()
  })
  observer.observe(container)
  return observer
}

function TerminalHeader({
  title,
  status,
  exitCode,
  errorReason,
}: {
  title?: string
  status: TerminalConnectionStatus
  exitCode: number | null
  errorReason: string | null
}) {
  const { t } = useLocale()
  const statusLabel = status === "exited"
    ? t("ops.terminal.exited", { code: exitCode ?? 0 })
    : t(`ops.terminal.${status}`)

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
          <TerminalIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span>{title ?? t("ops.terminal.title")}</span>
        </div>
        <Badge tone={statusTones[status]}>{statusLabel}</Badge>
      </div>
      {errorReason ? (
        <p role="alert" className="border-b border-line bg-danger-soft px-3 py-2 text-xs text-danger-ink">{errorReason}</p>
      ) : null}
    </>
  )
}

function TerminalSession({
  wsUrl,
  connection,
  title,
  className,
  viewportHeight,
}: {
  wsUrl: string
  connection: TerminalConnectionOptions
  title?: string
  className?: string
  viewportHeight: number | string
}) {
  const { t } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<TerminalConnectionStatus>("connecting")
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [errorReason, setErrorReason] = useState<string | null>(null)
  const connectionRef = useRef<TerminalConnectionOptions>(connection)
  const tRef = useRef(t)

  useEffect(() => {
    connectionRef.current = connection
    tRef.current = t
  }, [connection, t])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      convertEol: false,
      theme: { background: "#0f1115", foreground: "#d6f6e6" },
    })
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(container)
    fitAddon.fit()

    const socket = new WebSocket(resolveSocketUrl(wsUrl))
    socket.binaryType = "arraybuffer"
    const encoder = new TextEncoder()

    const updateStatus = (next: TerminalConnectionStatus) => {
      if (disposed) return
      setStatus(next)
      connectionRef.current.onStatusChange?.(next)
    }

    attachSocketHandlers(socket, terminal, fitAddon, {
      isDisposed: () => disposed,
      fallbackError: () => tRef.current("ops.terminal.error"),
      onStatus: updateStatus,
      onExit: (code) => {
        if (disposed) return
        setExitCode(code)
        updateStatus("exited")
        connectionRef.current.onExit?.(code)
      },
      onError: (reason) => {
        if (disposed) return
        setErrorReason(reason)
        updateStatus("error")
        connectionRef.current.onError?.(reason)
      },
    })

    const dataDisposable = terminal.onData((data) => {
      if (!disposed && socket.readyState === WebSocket.OPEN) socket.send(encoder.encode(data))
    })
    const binaryDisposable = terminal.onBinary((data) => {
      if (!disposed && socket.readyState === WebSocket.OPEN) socket.send(encodeBinaryString(data))
    })
    const resizeDisposable = terminal.onResize(({ cols, rows }) => {
      if (!disposed) sendJson(socket, { type: "resize", cols, rows })
    })
    const pingTimer = window.setInterval(() => {
      if (!disposed) sendJson(socket, { type: "ping" })
    }, PING_INTERVAL_MS)
    const resizeObserver = createBoundedResizeObserver(container, fitAddon)

    return () => {
      disposed = true
      window.clearInterval(pingTimer)
      resizeObserver?.disconnect()
      dataDisposable.dispose()
      binaryDisposable.dispose()
      resizeDisposable.dispose()
      socket.close()
      terminal.dispose()
    }
  }, [wsUrl])

  return (
    <section
      className={cn("flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-panel", className)}
      data-testid="terminal-pane"
    >
      <TerminalHeader title={title} status={status} exitCode={exitCode} errorReason={errorReason} />
      <div className="flex min-h-0 flex-1 flex-col bg-inverse p-2">
        <div
          ref={containerRef}
          className="h-full min-h-0 w-full flex-1 overflow-hidden"
          style={{ minHeight: viewportHeight }}
        />
      </div>
    </section>
  )
}

export default function TerminalPaneImpl({
  connection,
  title,
  className,
  minHeight = "22rem",
}: TerminalPaneProps) {
  const viewportHeight = typeof minHeight === "number" ? `${minHeight}px` : minHeight
  if (!connection) {
    return (
      <section
        className={cn("flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-panel", className)}
        data-testid="terminal-pane"
      >
        <TerminalHeader title={title} status="idle" exitCode={null} errorReason={null} />
        <div className="flex min-h-0 flex-1 flex-col bg-inverse p-2">
          <div className="h-full min-h-0 w-full flex-1 overflow-hidden" style={{ minHeight: viewportHeight }} />
        </div>
      </section>
    )
  }

  return (
    <TerminalSession
      key={connection.wsUrl}
      wsUrl={connection.wsUrl}
      connection={connection}
      title={title}
      className={className}
      viewportHeight={viewportHeight}
    />
  )
}
