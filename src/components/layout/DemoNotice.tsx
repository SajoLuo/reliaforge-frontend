import { ExternalLink } from "lucide-react"
import { useLocale } from "@/i18n/useLocale"

export function DemoNotice() {
  const { locale, t } = useLocale()
  const quickStartUrl = locale === "zh"
    ? "https://reliaforge.dev/zh/guide/getting-started.html"
    : "https://reliaforge.dev/guide/getting-started.html"
  return (
    <aside
      className="flex min-h-10 flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-warning-soft px-4 py-2 text-center text-xs text-warning-ink sm:text-sm"
      aria-label={t("demo.label")}
      data-testid="demo-notice"
    >
      <strong>{t("demo.title")}</strong>
      <span className="hidden sm:inline">{t("demo.description")}</span>
      <a
        className="inline-flex items-center gap-1 font-medium underline decoration-warning-ink/40 underline-offset-4 transition-colors hover:text-ink focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        href={quickStartUrl}
      >
        {t("demo.quickStart")}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </aside>
  )
}
