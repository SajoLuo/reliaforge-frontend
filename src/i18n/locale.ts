import type { Locale } from "@/i18n/messages"

export const LOCALE_STORAGE_KEY = "rf.locale"

function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (raw === "zh" || raw === "en") return raw
  return null
}

function parseLocaleQuery(search?: string): Locale | null {
  const fromParam = search ? normalizeLocale(new URLSearchParams(search).get("lang")) : null
  if (fromParam) return fromParam
  if (typeof window === "undefined") return null
  return normalizeLocale(new URLSearchParams(window.location.search).get("lang"))
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))
  } catch {
    return null
  }
}

function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore restricted storage environments.
  }
}

function browserLocale(): Locale {
  if (typeof navigator === "undefined") return "en"
  const primary = navigator.languages?.[0] || navigator.language || "en"
  return /^zh/i.test(primary) ? "zh" : "en"
}

export function detectLocale(search?: string): Locale {
  const fromQuery = parseLocaleQuery(search)
  if (fromQuery) {
    writeStoredLocale(fromQuery)
    return fromQuery
  }
  return readStoredLocale() ?? browserLocale()
}

export function semanticPath(pathname: string): string {
  if (pathname === "/zh" || pathname === "/zh/") return "/"
  if (pathname.startsWith("/zh/")) return pathname.slice(3)
  return pathname || "/"
}

export function localePath(pathname: string): string {
  return semanticPath(pathname)
}
