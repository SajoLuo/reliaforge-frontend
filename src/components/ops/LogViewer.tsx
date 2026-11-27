import { Check, Clock, Copy, Download, Pause, Play, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { LogLine, LogViewerProps } from "@reliaforge/plugin-sdk"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import { createEventSource } from "@/runtime/sdkTransport"

const DEFAULT_MAX_LINES = 5000

function appendWithCap(existing: LogLine[], incoming: LogLine[], cap: number): LogLine[] {
  if (incoming.length === 0) return existing
  const combined = [...existing, ...incoming]
  return combined.length > cap ? combined.slice(combined.length - cap) : combined
}

function optionalField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key]
  return typeof value === "string" ? value : undefined
}

function parseLogRecord(record: Record<string, unknown>): LogLine | null {
  const text = "message" in record ? record.message : "line" in record ? record.line : null
  if (text === null || text === undefined) return null
  return {
    id: optionalField(record, "id"),
    timestamp: optionalField(record, "timestamp"),
    level: optionalField(record, "level"),
    source: optionalField(record, "source"),
    message: String(text),
  }
}

function defaultParseSseEvent(event: MessageEvent<string>): LogLine | LogLine[] | null {
  const raw = event.data
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === "object" && parsed !== null) {
      return parseLogRecord(parsed as Record<string, unknown>) ?? { message: raw }
    }
  } catch {
    return { message: raw }
  }
  return { message: raw }
}

function formatLine(line: LogLine, includeTimestamp: boolean): string {
  const parts: string[] = []
  if (includeTimestamp && line.timestamp) parts.push(line.timestamp)
  if (line.level) parts.push(`[${line.level.toUpperCase()}]`)
  if (line.source) parts.push(`${line.source}:`)
  parts.push(line.message)
  return parts.join(" ")
}

function SseLogSubscriber({
  streamUrl,
  parseLine,
  onLines,
  onStatus,
}: {
  streamUrl: string
  parseLine: (rawEvent: MessageEvent<string>) => LogLine | LogLine[] | null
  onLines: (items: LogLine[]) => void
  onStatus: (status: "streaming" | "error") => void
}) {
  const parseRef = useRef(parseLine)
  const onLinesRef = useRef(onLines)
  const onStatusRef = useRef(onStatus)

  useEffect(() => {
    parseRef.current = parseLine
    onLinesRef.current = onLines
    onStatusRef.current = onStatus
  }, [onLines, onStatus, parseLine])

  useEffect(() => {
    const source = createEventSource(streamUrl)
    const onEvent = (event: MessageEvent<string>) => {
      const parsed = parseRef.current(event)
      if (!parsed) return
      onLinesRef.current(Array.isArray(parsed) ? parsed : [parsed])
    }
    source.onopen = () => onStatusRef.current("streaming")
    source.onmessage = onEvent
    source.addEventListener("log", onEvent as EventListener)
    source.onerror = () => onStatusRef.current("error")
    return () => {
      source.removeEventListener("log", onEvent as EventListener)
      source.close()
    }
  }, [streamUrl])

  return null
}

function StreamBadge({ streamUrl, streamStatus, paused }: {
  streamUrl?: string
  streamStatus: "streaming" | "error"
  paused: boolean
}) {
  const { t } = useLocale()
  if (!streamUrl) return null
  const tone = streamStatus === "error" ? "danger" : paused ? "warning" : "success"
  const label = streamStatus === "error"
    ? t("ops.logs.error")
    : paused
      ? t("ops.logs.paused")
      : t("ops.logs.streaming")
  return <Badge tone={tone}>{label}</Badge>
}

function LogToolbar({
  title,
  streamUrl,
  streamStatus,
  paused,
  showTimestamps,
  filterText,
  copied,
  onFilterChange,
  onTogglePause,
  onToggleTimestamps,
  onCopy,
  onDownload,
}: {
  title?: string
  streamUrl?: string
  streamStatus: "streaming" | "error"
  paused: boolean
  showTimestamps: boolean
  filterText: string
  copied: boolean
  onFilterChange: (value: string) => void
  onTogglePause: () => void
  onToggleTimestamps: () => void
  onCopy: () => void
  onDownload: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-canvas/60 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {title ? <h3 className="text-sm font-semibold text-ink">{title}</h3> : null}
        <StreamBadge streamUrl={streamUrl} streamStatus={streamStatus} paused={paused} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md border bg-panel px-2.5 py-1">
          <Search className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={filterText}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={t("ops.logs.filterPlaceholder")}
            aria-label={t("ops.logs.filterPlaceholder")}
            className="w-40 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none sm:w-52"
          />
        </div>
        <Button type="button" variant="secondary" size="small" aria-pressed={paused} onClick={onTogglePause}>
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
          {paused ? t("ops.logs.resume") : t("ops.logs.pause")}
        </Button>
        <Button type="button" variant="secondary" size="small" aria-pressed={showTimestamps} onClick={onToggleTimestamps}>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("ops.logs.timestamps")}
        </Button>
        <Button type="button" variant="secondary" size="small" onClick={onCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? t("ops.logs.copied") : t("ops.logs.copy")}
        </Button>
        <Button type="button" variant="secondary" size="small" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {t("ops.logs.download")}
        </Button>
      </div>
    </div>
  )
}

function LogLineRow({ line, showTimestamps }: { line: LogLine; showTimestamps: boolean }) {
  return (
    <div className="whitespace-pre-wrap break-words py-0.5">
      {showTimestamps && line.timestamp ? <span className="mr-2 text-inverse-muted">{line.timestamp}</span> : null}
      {line.level ? <span className="mr-2 font-semibold">[{line.level}]</span> : null}
      {line.source ? <span className="mr-2 text-inverse-muted">{line.source}:</span> : null}
      <span>{line.message}</span>
    </div>
  )
}

function LogViewport({
  viewportRef,
  loading,
  lines,
  emptyMessage,
  showTimestamps,
}: {
  viewportRef: React.RefObject<HTMLDivElement>
  loading: boolean
  lines: LogLine[]
  emptyMessage?: string
  showTimestamps: boolean
}) {
  const { t } = useLocale()
  return (
    <div
      ref={viewportRef}
      className="max-h-[28rem] min-h-[12rem] overflow-y-auto bg-inverse px-4 py-3 font-mono text-xs leading-5 text-code-ink tabular-nums"
    >
      {loading && lines.length === 0 ? (
        <p className="text-inverse-muted">{t("ops.loadingData")}</p>
      ) : lines.length === 0 ? (
        <p className="text-inverse-muted">{emptyMessage ?? t("ops.logs.empty")}</p>
      ) : (
        lines.map((line, index) => (
          <LogLineRow
            key={line.id ?? `${index}-${line.timestamp ?? ""}`}
            line={line}
            showTimestamps={showTimestamps}
          />
        ))
      )}
    </div>
  )
}

function matchesLogQuery(line: LogLine, query: string): boolean {
  return (
    line.message.toLowerCase().includes(query)
    || (line.source?.toLowerCase().includes(query) ?? false)
    || (line.level?.toLowerCase().includes(query) ?? false)
  )
}

function downloadTextFile(text: string, fileName: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function useStreamedLogs(
  streamUrl: string | undefined,
  maxLines: number,
) {
  const [record, setRecord] = useState<{
    url?: string
    lines: LogLine[]
    status: "streaming" | "error"
  }>({ url: streamUrl, lines: [], status: "streaming" })

  const activeLines = useMemo(
    () => (record.url === streamUrl ? record.lines : []),
    [record, streamUrl],
  )
  const status = record.url === streamUrl ? record.status : "streaming"

  const pushLines = (items: LogLine[]) => {
    setRecord((prev) => ({
      url: streamUrl,
      status: prev.url === streamUrl ? prev.status : "streaming",
      lines: appendWithCap(prev.url === streamUrl ? prev.lines : [], items, maxLines),
    }))
  }

  const updateStatus = (nextStatus: "streaming" | "error") => {
    setRecord((prev) => ({
      url: streamUrl,
      lines: prev.url === streamUrl ? prev.lines : [],
      status: nextStatus,
    }))
  }

  return { activeLines, status, pushLines, updateStatus }
}

export function LogViewer({
  lines = [],
  streamUrl,
  parseLine = defaultParseSseEvent,
  maxLines = DEFAULT_MAX_LINES,
  title,
  loading = false,
  error = null,
  emptyMessage,
  defaultShowTimestamps = true,
  downloadFileName = "reliaforge-logs.log",
  className,
}: LogViewerProps) {
  const { activeLines, status: streamStatus, pushLines, updateStatus } = useStreamedLogs(streamUrl, maxLines)
  const [paused, setPaused] = useState(false)
  const [showTimestamps, setShowTimestamps] = useState(defaultShowTimestamps)
  const [filterText, setFilterText] = useState("")
  const [copied, setCopied] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  const allLines = useMemo(
    () => appendWithCap(lines, activeLines, maxLines),
    [activeLines, lines, maxLines],
  )

  const visibleLines = useMemo(() => {
    const query = filterText.trim().toLowerCase()
    return query ? allLines.filter((line) => matchesLogQuery(line, query)) : allLines
  }, [allLines, filterText])

  useEffect(() => {
    if (!paused && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [paused, visibleLines.length])

  const exportText = useMemo(
    () => visibleLines.map((line) => formatLine(line, showTimestamps)).join("\n"),
    [showTimestamps, visibleLines],
  )

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(exportText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className={cn("overflow-hidden rounded-lg border bg-panel", className)} data-testid="log-viewer">
      {streamUrl ? (
        <SseLogSubscriber
          key={streamUrl}
          streamUrl={streamUrl}
          parseLine={parseLine}
          onLines={pushLines}
          onStatus={updateStatus}
        />
      ) : null}

      <LogToolbar
        title={title}
        streamUrl={streamUrl}
        streamStatus={streamStatus}
        paused={paused}
        showTimestamps={showTimestamps}
        filterText={filterText}
        copied={copied}
        onFilterChange={setFilterText}
        onTogglePause={() => setPaused((p) => !p)}
        onToggleTimestamps={() => setShowTimestamps((s) => !s)}
        onCopy={() => void handleCopy()}
        onDownload={() => downloadTextFile(exportText, downloadFileName)}
      />

      {error ? <p role="alert" className="border-b bg-danger-soft px-4 py-2 text-xs text-danger-ink">{error}</p> : null}

      <LogViewport
        viewportRef={viewportRef}
        loading={loading}
        lines={visibleLines}
        emptyMessage={emptyMessage}
        showTimestamps={showTimestamps}
      />
    </section>
  )
}
