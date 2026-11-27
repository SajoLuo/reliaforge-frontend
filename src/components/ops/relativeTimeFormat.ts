import type { Locale } from "@/i18n/messages"

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function formatCalendarTime(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatPastDuration(diffSec: number, locale: Locale): string {
  if (diffSec < 60) {
    return locale === "zh" ? `${diffSec} 秒前` : `${diffSec}s ago`
  }
  const minutes = Math.floor(diffSec / 60)
  if (minutes < 60) {
    return locale === "zh" ? `${minutes} 分钟前` : `${minutes}m ago`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return locale === "zh" ? `${hours} 小时前` : `${hours}h ago`
  }
  return ""
}

export function formatRelativeTime(date: Date, nowMs: number, locale: Locale): string {
  const diffMs = nowMs - date.getTime()
  if (diffMs <= 0) {
    return locale === "zh" ? "刚刚" : "just now"
  }
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec === 0) {
    return locale === "zh" ? "刚刚" : "just now"
  }
  return formatPastDuration(diffSec, locale) || formatCalendarTime(date)
}
