import { useContext } from "react"
import { LocaleContext, type LocaleContextValue } from "@/i18n/context"

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}
