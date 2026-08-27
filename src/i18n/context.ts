import { createContext } from "react"
import { localePath } from "@/i18n/locale"
import { translate, type Locale } from "@/i18n/messages"
import type { Translator } from "@/i18n/types"

export interface LocaleContextValue {
  locale: Locale
  t: Translator
  pathFor: (path: string) => string
  switchLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: (key, values) => translate("en", key, values),
  pathFor: (path) => localePath(path, "en"),
  switchLocale: () => undefined,
})
