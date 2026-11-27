import type { StatusProps, StatusTone, StatusVariant } from "@reliaforge/plugin-sdk"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/i18n/messages"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

export type { StatusProps, StatusTone, StatusVariant }

interface StatusSpec {
  tone: StatusTone
  en: string
  zh: string
}

const STATUS_SPECS: Record<string, StatusSpec> = {
  healthy: { tone: "success", en: "Healthy", zh: "健康" },
  running: { tone: "success", en: "Running", zh: "运行中" },
  online: { tone: "success", en: "Online", zh: "在线" },
  synced: { tone: "success", en: "Synced", zh: "已同步" },
  normal: { tone: "success", en: "Normal", zh: "正常" },
  succeeded: { tone: "success", en: "Succeeded", zh: "成功" },
  ok: { tone: "success", en: "OK", zh: "正常" },
  progressing: { tone: "info", en: "Progressing", zh: "发布中" },
  degraded: { tone: "warning", en: "Degraded", zh: "降级" },
  outofsync: { tone: "warning", en: "OutOfSync", zh: "未同步" },
  warning: { tone: "warning", en: "Warning", zh: "警告" },
  pending: { tone: "warning", en: "Pending", zh: "等待中" },
  unhealthy: { tone: "danger", en: "Unhealthy", zh: "不健康" },
  error: { tone: "danger", en: "Error", zh: "异常" },
  failed: { tone: "danger", en: "Failed", zh: "失败" },
  firing: { tone: "danger", en: "Firing", zh: "告警中" },
  active: { tone: "danger", en: "Active", zh: "触发中" },
  denied: { tone: "danger", en: "Denied", zh: "已拒绝" },
  blocked: { tone: "danger", en: "Blocked", zh: "已拦截" },
  stopped: { tone: "neutral", en: "Stopped", zh: "已停止" },
  offline: { tone: "neutral", en: "Offline", zh: "离线" },
  suppressed: { tone: "neutral", en: "Suppressed", zh: "已静默" },
  unknown: { tone: "neutral", en: "Unknown", zh: "未知" },
}

const DOT_COLORS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted/60",
}

const DOT_TEXT_COLORS: Record<StatusTone, string> = {
  success: "text-ink",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
  info: "text-info-ink",
  neutral: "text-muted",
}

function resolveStatus(value: string, locale: Locale, explicitTone?: StatusTone, explicitLabel?: string) {
  const normalized = value.trim().toLowerCase()
  const spec = STATUS_SPECS[normalized]
  const tone = explicitTone ?? spec?.tone ?? "neutral"
  const label = explicitLabel ?? (spec ? (locale === "zh" ? spec.zh : spec.en) : value)
  return { tone, label }
}

function usesBadge(variant: StatusVariant, tone: StatusTone): boolean {
  if (variant === "badge") return true
  if (variant === "dot") return false
  return tone === "warning" || tone === "danger" || tone === "info"
}

export function Status({
  value,
  label,
  tone: explicitTone,
  variant = "auto",
  className,
  ...props
}: StatusProps) {
  const { locale } = useLocale()
  const resolved = resolveStatus(value, locale, explicitTone, label)

  if (usesBadge(variant, resolved.tone)) {
    return (
      <Badge tone={resolved.tone} className={cn("gap-1.5", className)} {...props}>
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_COLORS[resolved.tone])} aria-hidden="true" />
        <span>{resolved.label}</span>
      </Badge>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium",
        DOT_TEXT_COLORS[resolved.tone],
        className,
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_COLORS[resolved.tone])} aria-hidden="true" />
      <span>{resolved.label}</span>
    </span>
  )
}

export function StatusBadge(props: StatusProps) {
  return <Status variant="badge" {...props} />
}

export function StatusDot(props: StatusProps) {
  return <Status variant="dot" {...props} />
}
