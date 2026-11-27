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
  onStatus: (next: TerminalConnectionStatus) => void
  onExit: (code: number) => void
  onError: (reason: string) => void
  fallbackError: string
}

function attachSocketHandlers(
  socket: WebSocket,
  terminal: Terminal,
  fitAddon: FitAddon,
  callbacks: SessionCallbacks,
) {
  let settled = false
  socket.onopen = () => {
    callbacks.onStatus("connected")
    fitAddon.fit()
    sendJson(socket, { type: "resize", cols: terminal.cols, rows: terminal.rows })
  }
  socket.onmessage = (event) => {
    if (event.data instanceof ArrayBuffer) {
      terminal.write(new Uint8Array(event.data))
      return
    }
    if (typeof Blob !== "undefined" && event.data instanceof Blob) {
      void event.data.arrayBuffer().then((buffer) => terminal.write(new Uint8Array(buffer)))
      return
    }
    if (typeof event.data !== "string") return
    const msg = parseControlMessage(event.data)
    if (!msg) return
    if (msg.type === "exit") {
      settled = true
      callbacks.onExit(typeof msg.code === "number" ? msg.code : 0)
    } else if (msg.type === "error") {
      settled = true
      callbacks.onError(typeof msg.reason === "string" ? msg.reason : callbacks.fallbackError)
    }
  }
  socket.onerror = () => {
    if (!settled) {
      settled = true
      callbacks.onError("WebSocket connection error")
    }
  }
  socket.onclose = () => {
    if (!settled) callbacks.onStatus("closed")
  }
}

export default function TerminalPaneImpl({
  connection,
  title,
  className,
  minHeight = "22rem",
}: TerminalPaneProps) {
  const { t } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<TerminalConnectionStatus>("connecting")
  const [exitCode, setExitCode] = useState<number | null>(null)
  const [errorReason, setErrorReason] = useState<string | null>(null)
  const connectionRef = useRef<TerminalConnectionOptions | null>(connection)

  useEffect(() => {
    connectionRef.current = connection
  }, [connection])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !connection) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      convertEol: false,
      theme: { background: "#0b110e", foreground: "#d6f6e6" },
    })
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(container)
    fitAddon.fit()

    const socket = new WebSocket(resolveSocketUrl(connection.wsUrl))
    socket.binaryType = "arraybuffer"
    const encoder = new TextEncoder()

    const updateStatus = (next: TerminalConnectionStatus) => {
      setStatus(next)
      connectionRef.current?.onStatusChange?.(next)
    }

    attachSocketHandlers(socket, terminal, fitAddon, {
      fallbackError: t("ops.terminal.error"),
      onStatus: updateStatus,
      onExit: (code) => {
        setExitCode(code)
        updateStatus("exited")
        connectionRef.current?.onExit?.(code)
      },
      onError: (reason) => {
        setErrorReason(reason)
        updateStatus("error")
        connectionRef.current?.onError?.(reason)
      },
    })

    const dataDisposable = terminal.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(encoder.encode(data))
    })
    const binaryDisposable = terminal.onBinary((data) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(encodeBinaryString(data))
    })
    const resizeDisposable = terminal.onResize(({ cols, rows }) => {
      sendJson(socket, { type: "resize", cols, rows })
    })
    const pingTimer = window.setInterval(() => sendJson(socket, { type: "ping" }), PING_INTERVAL_MS)
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => fitAddon.fit())
      : null
    resizeObserver?.observe(container)

    return () => {
      window.clearInterval(pingTimer)
      resizeObserver?.disconnect()
      dataDisposable.dispose()
      binaryDisposable.dispose()
      resizeDisposable.dispose()
      socket.close()
      terminal.dispose()
    }
  }, [connection, t])

  const effectiveStatus = connection ? status : "idle"
  const statusLabel = effectiveStatus === "exited"
    ? t("ops.terminal.exited", { code: exitCode ?? 0 })
    : t(`ops.terminal.${effectiveStatus}`)

  return (
    <section className={cn("overflow-hidden rounded-lg border bg-panel", className)} data-testid="terminal-pane">
      <div className="flex items-center justify-between gap-3 border-b bg-canvas/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <TerminalIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          <span>{title ?? t("ops.terminal.title")}</span>
        </div>
        <Badge tone={statusTones[effectiveStatus]}>{statusLabel}</Badge>
      </div>
      {errorReason && connection ? (
        <p role="alert" className="border-b bg-danger-soft px-4 py-2 text-xs text-danger-ink">{errorReason}</p>
      ) : null}
      <div ref={containerRef} className="w-full bg-inverse p-2" style={{ minHeight }} />
    </section>
  )
}
