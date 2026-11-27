import { useEffect, useMemo, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { LocaleContext, type LocaleContextValue } from "@/i18n/context"
import { detectLocale, localePath } from "@/i18n/locale"
import { translate, type MessageKey } from "@/i18n/messages"
import type { Translator } from "@/i18n/types"

function pageTitleKey(pathname: string): MessageKey {
  const path = localePath(pathname)
  if (path === "/platform") return "meta.platform"
  if (path === "/about") return "meta.about"
  if (path === "/plugins") return "meta.plugins"
  if (path.startsWith("/plugins/")) return "meta.plugin"
  if (path === "/p" || path.startsWith("/p/")) return "meta.workspace"
  return "meta.overview"
}

export interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const location = useLocation()
  const locale = detectLocale(location.search)

  const value = useMemo<LocaleContextValue>(() => {
    const t: Translator = (key, values) => translate(locale, key, values)
    return {
      locale,
      t,
      pathFor: (path) => localePath(path),
    }
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"
    document.title = translate(locale, pageTitleKey(location.pathname))
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      translate(locale, "meta.description"),
    )
  }, [locale, location.pathname])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
