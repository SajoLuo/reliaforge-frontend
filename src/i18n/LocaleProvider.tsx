import { useEffect, useMemo, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { LocaleContext, type LocaleContextValue } from "@/i18n/context"
import { localeFromPath, localePath } from "@/i18n/locale"
import { translate, type MessageKey } from "@/i18n/messages"
import type { Translator } from "@/i18n/types"

function pageTitleKey(pathname: string): MessageKey {
  const path = localePath(pathname, "en")
  if (path === "/about") return "meta.about"
  if (path === "/plugins") return "meta.plugins"
  if (path.startsWith("/plugins/")) return "meta.plugin"
  return "meta.overview"
}

export interface LocaleProviderProps {
  children: ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const locale = localeFromPath(location.pathname)

  const value = useMemo<LocaleContextValue>(() => {
    const t: Translator = (key, values) => translate(locale, key, values)
    return {
      locale,
      t,
      pathFor: (path) => localePath(path, locale),
      switchLocale: (nextLocale) => {
        if (nextLocale === locale) return
        navigate({
          pathname: localePath(location.pathname, nextLocale),
          search: location.search,
        })
      },
    }
  }, [locale, location.pathname, location.search, navigate])

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
