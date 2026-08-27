import type { Locale } from "@/i18n/messages"

export function localeFromPath(pathname: string): Locale {
  return pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en"
}

export function semanticPath(pathname: string): string {
  if (pathname === "/zh") return "/"
  if (pathname.startsWith("/zh/")) return pathname.slice(3)
  return pathname || "/"
}

export function localePath(pathname: string, locale: Locale): string {
  const semantic = semanticPath(pathname)
  if (locale === "en") return semantic
  return semantic === "/" ? "/zh/" : `/zh${semantic}`
}
