import { ExternalLink } from "lucide-react"
import { useLocale } from "@/i18n/useLocale"

export function DemoNotice() {
  const { locale, t } = useLocale()
  const quickStartUrl = locale === "zh"
    ? "https://sajoluo.github.io/reliaforge/zh/guide/getting-started.html"
    : "https://sajoluo.github.io/reliaforge/guide/getting-started.html"
  return (
    <aside
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-warning-soft px-4 py-2 text-center text-sm text-warning-ink"
      aria-label={t("demo.label")}
      data-testid="demo-notice"
    >
      <strong>{t("demo.title")}</strong>
      <span className="hidden sm:inline">{t("demo.description")}</span>
      <a
        className="inline-flex items-center gap-1 font-bold underline underline-offset-2"
        href={quickStartUrl}
      >
        {t("demo.quickStart")}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </aside>
  )
}
