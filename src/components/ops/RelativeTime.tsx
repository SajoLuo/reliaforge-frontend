import { useEffect, useState } from "react"
import type { RelativeTimeProps } from "@reliaforge/plugin-sdk"
import { formatRelativeTime } from "@/components/ops/relativeTimeFormat"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

export type { RelativeTimeProps }

const REFRESH_INTERVAL_MS = 30_000

function parseDateValue(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function RelativeTime({ value, className }: RelativeTimeProps) {
  const { locale } = useLocale()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const date = parseDateValue(value)

  useEffect(() => {
    if (!date) return
    const timer = window.setInterval(() => setNowMs(Date.now()), REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [date])

  if (!date) {
    return <span className={cn("text-muted", className)}>—</span>
  }

  const label = formatRelativeTime(date, nowMs, locale)
  const absolute = date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US")

  return (
    <time
      dateTime={date.toISOString()}
      title={absolute}
      className={cn("whitespace-nowrap tabular-nums", className)}
    >
      {label}
    </time>
  )
}
