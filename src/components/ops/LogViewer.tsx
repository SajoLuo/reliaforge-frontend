import { Check, Clock, Copy, Download, Pause, Play, Search, WrapText } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { LogLine, LogViewerProps } from "@reliaforge/plugin-sdk"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"
import { createEventSource } from "@/runtime/sdkTransport"

const DEFAULT_MAX_LINES = 5000

type NormalizedLogLevel = "error" | "warn" | "info" | "debug" | "none"

const LEVEL_STYLES: Record<NormalizedLogLevel, { badge: string; row: string }> = {
  error: { badge: "text-danger-ink font-semibold", row: "bg-danger-soft/40" },
  warn: { badge: "text-warning-ink font-semibold", row: "bg-warning-soft/35" },
  info: { badge: "text-info-ink font-medium", row: "" },
  debug: { badge: "text-muted", row: "" },
  none: { badge: "text-muted", row: "" },
}

const LOG_LEVEL_MAP: Record<string, NormalizedLogLevel> = {
  FATAL: "error",
  ERROR: "error",
  ERR: "error",
  CRIT: "error",
  WARN: "warn",
  WARNING: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "debug",
}

const LOG_LEVEL_PATTERN = /\b(FATAL|ERROR|ERR|CRIT|WARN(?:ING)?|INFO|DEBUG|TRACE)\b/i

function normalizeLogLevel(line: LogLine): NormalizedLogLevel {
  const candidate = line.level?.trim().toUpperCase()
  const detected = candidate || LOG_LEVEL_PATTERN.exec(line.message)?.[1]?.toUpperCase() || ""
  return LOG_LEVEL_MAP[detected] ?? "none"
}

function formatDisplayTimestamp(raw?: string): string {
  if (!raw) return ""
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(raw)) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      const h = String(parsed.getHours()).padStart(2, "0")
      const m = String(parsed.getMinutes()).padStart(2, "0")
      const s = String(parsed.getSeconds()).padStart(2, "0")
      return `${h}:${m}:${s}`
    }
  }
  return raw
}

function stripDuplicateTimestamp(message: string, timestamp?: string): string {
  if (!timestamp) return message
  if (message.startsWith(timestamp)) {
    return message.slice(timestamp.length).replace(/^\s+/, "")
  }
  return message
}

function appendWithCap(existing: LogLine[], incoming: LogLine[], cap: number): LogLine[] {
  const combined = incoming.length === 0 ? existing : [...existing, ...incoming]
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
  wrapLines,
  filterText,
  copied,
  canCopy,
  onFilterChange,
  onTogglePause,
  onToggleTimestamps,
  onToggleWrap,
  onCopy,
  onDownload,
}: {
  title?: string
  streamUrl?: string
  streamStatus: "streaming" | "error"
  paused: boolean
  showTimestamps: boolean
  wrapLines: boolean
  filterText: string
  copied: boolean
  canCopy: boolean
  onFilterChange: (value: string) => void
  onTogglePause: () => void
  onToggleTimestamps: () => void
  onToggleWrap: () => void
  onCopy: () => void
  onDownload: () => void
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel px-3 py-2">
      <div className="flex items-center gap-2">
        {title ? <h3 className="text-xs font-semibold text-ink">{title}</h3> : null}
        <StreamBadge streamUrl={streamUrl} streamStatus={streamStatus} paused={paused} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-md border border-line bg-panel-inset px-2 py-1">
          <Search className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={filterText}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={t("ops.logs.filterPlaceholder")}
            aria-label={t("ops.logs.filterPlaceholder")}
            className="w-36 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none sm:w-48"
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
        <Button type="button" variant="secondary" size="small" aria-pressed={wrapLines} onClick={onToggleWrap}>
          <WrapText className="h-3.5 w-3.5" aria-hidden="true" />
          {t("ops.logs.wrap")}
        </Button>
        <Button type="button" variant="secondary" size="small" disabled={!canCopy} onClick={onCopy}>
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

function LogLineRow({
  line,
  displayTimestamp,
  repeatedTimestamp,
  showTimestamps,
  wrapLines,
}: {
  line: LogLine
  displayTimestamp: string
  repeatedTimestamp: boolean
  showTimestamps: boolean
  wrapLines: boolean
}) {
  const level = normalizeLogLevel(line)
  const styles = LEVEL_STYLES[level]
  const cleanMessage = stripDuplicateTimestamp(line.message, line.timestamp)

  return (
    <div
      className={cn(
        "rounded-sm px-1.5 py-0.5",
        wrapLines ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        styles.row,
      )}
    >
      {showTimestamps && displayTimestamp ? (
        <span
          title={line.timestamp}
          aria-hidden={repeatedTimestamp || undefined}
          className={cn("mr-2 text-muted", repeatedTimestamp && "select-none opacity-0")}
        >
          {displayTimestamp}
        </span>
      ) : null}
      {line.level ? <span className={cn("mr-2", styles.badge)}>[{line.level}]</span> : null}
      {line.source ? <span className="mr-2 text-muted">{line.source}:</span> : null}
      <span className={level === "error" ? "text-danger-ink" : undefined}>{cleanMessage}</span>
    </div>
  )
}

function LogViewport({
  viewportRef,
  loading,
  lines,
  emptyMessage,
  showTimestamps,
  wrapLines,
}: {
  viewportRef: React.RefObject<HTMLDivElement>
  loading: boolean
  lines: LogLine[]
  emptyMessage?: string
  showTimestamps: boolean
  wrapLines: boolean
}) {
  const { t } = useLocale()
  const renderedTimestamps = lines.map((line) => formatDisplayTimestamp(line.timestamp))

  return (
    <div
      ref={viewportRef}
      className={cn(
        "max-h-[28rem] min-h-[12rem] overflow-y-auto bg-panel-inset px-3 py-2.5 font-mono text-xs leading-5 text-ink tabular-nums",
        !wrapLines && "overflow-x-auto",
      )}
    >
      {loading && lines.length === 0 ? (
        <p className="text-muted">{t("ops.loadingData")}</p>
      ) : lines.length === 0 ? (
        <p className="text-muted">{emptyMessage ?? t("ops.logs.empty")}</p>
      ) : (
        lines.map((line, index) => {
          const displayTs = renderedTimestamps[index]
          const repeated = Boolean(displayTs) && index > 0 && renderedTimestamps[index - 1] === displayTs
          return (
            <LogLineRow
              key={line.id ?? `${index}-${line.timestamp ?? ""}`}
              line={line}
              displayTimestamp={displayTs}
              repeatedTimestamp={repeated}
              showTimestamps={showTimestamps}
              wrapLines={wrapLines}
            />
          )
        })
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

async function copyToClipboard(text: string): Promise<boolean> {
  const writeText = navigator?.clipboard?.writeText
  if (typeof writeText !== "function") return false
  try {
    await writeText.call(navigator.clipboard, text)
    return true
  } catch {
    return false
  }
}

function hasClipboardApi(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
}

function filterVisibleLogLines(lines: LogLine[], filterText: string): LogLine[] {
  const query = filterText.trim().toLowerCase()
  return query ? lines.filter((line) => matchesLogQuery(line, query)) : lines
}

function LogErrorBanner({ error }: { error: string | null }) {
  if (!error) return null
  return <p role="alert" className="border-b border-line bg-danger-soft px-3 py-2 text-xs text-danger-ink">{error}</p>
}

function useAutoScroll(
  viewportRef: React.RefObject<HTMLDivElement>,
  paused: boolean,
  lineCount: number,
) {
  useEffect(() => {
    if (!paused && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [lineCount, paused, viewportRef])
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
  defaultWrap = true,
  downloadFileName = "reliaforge-logs.log",
  className,
}: LogViewerProps) {
  const { activeLines, status: streamStatus, pushLines, updateStatus } = useStreamedLogs(streamUrl, maxLines)
  const [pausedSnapshot, setPausedSnapshot] = useState<LogLine[] | null>(null)
  const [showTimestamps, setShowTimestamps] = useState(defaultShowTimestamps)
  const [wrapLines, setWrapLines] = useState(defaultWrap)
  const [filterText, setFilterText] = useState("")
  const [copied, setCopied] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const paused = pausedSnapshot !== null

  const liveLines = useMemo(
    () => appendWithCap(lines, activeLines, maxLines),
    [activeLines, lines, maxLines],
  )
  const visibleLines = useMemo(
    () => filterVisibleLogLines(pausedSnapshot ?? liveLines, filterText),
    [filterText, liveLines, pausedSnapshot],
  )

  useAutoScroll(viewportRef, paused, visibleLines.length)

  const exportText = useMemo(
    () => visibleLines.map((line) => formatLine(line, showTimestamps)).join("\n"),
    [showTimestamps, visibleLines],
  )

  const handleCopy = async () => {
    if (!(await copyToClipboard(exportText))) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className={cn("overflow-hidden rounded-lg border border-line bg-panel shadow-panel", className)} data-testid="log-viewer">
      {streamUrl ? (
        <SseLogSubscriber key={streamUrl} streamUrl={streamUrl} parseLine={parseLine} onLines={pushLines} onStatus={updateStatus} />
      ) : null}

      <LogToolbar
        title={title}
        streamUrl={streamUrl}
        streamStatus={streamStatus}
        paused={paused}
        showTimestamps={showTimestamps}
        wrapLines={wrapLines}
        filterText={filterText}
        copied={copied}
        canCopy={hasClipboardApi()}
        onFilterChange={setFilterText}
        onTogglePause={() => setPausedSnapshot((prev) => (prev === null ? liveLines : null))}
        onToggleTimestamps={() => setShowTimestamps((s) => !s)}
        onToggleWrap={() => setWrapLines((w) => !w)}
        onCopy={() => void handleCopy()}
        onDownload={() => downloadTextFile(exportText, downloadFileName)}
      />

      <LogErrorBanner error={error} />

      <LogViewport
        viewportRef={viewportRef}
        loading={loading}
        lines={visibleLines}
        emptyMessage={emptyMessage}
        showTimestamps={showTimestamps}
        wrapLines={wrapLines}
      />
    </section>
  )
}
