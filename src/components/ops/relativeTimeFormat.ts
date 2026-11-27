import type { Locale } from "@/i18n/messages"

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function formatCalendarTime(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatPastDuration(diffSec: number, locale: Locale): string {
  if (diffSec < 60) {
    const seconds = Math.max(0, diffSec)
    return locale === "zh" ? `${seconds} 秒前` : `${seconds}s ago`
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

function formatFutureDuration(aheadSec: number, locale: Locale): string {
  if (aheadSec < 60) {
    return locale === "zh" ? `${aheadSec} 秒后` : `in ${aheadSec}s`
  }
  const minutes = Math.floor(aheadSec / 60)
  if (minutes < 60) {
    return locale === "zh" ? `${minutes} 分钟后` : `in ${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return locale === "zh" ? `${hours} 小时后` : `in ${hours}h`
  }
  return ""
}

export function formatRelativeTime(date: Date, nowMs: number, locale: Locale): string {
  const diffSec = Math.floor((nowMs - date.getTime()) / 1000)
  if (diffSec < -5) {
    return formatFutureDuration(-diffSec, locale) || formatCalendarTime(date)
  }
  return formatPastDuration(diffSec, locale) || formatCalendarTime(date)
}
