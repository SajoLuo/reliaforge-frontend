import { BookOpen, Code2, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { useLocale } from "@/i18n/useLocale"

export function AboutPage() {
  const { locale, t } = useLocale()
  const guideRoot = `https://reliaforge.dev/${locale === "zh" ? "zh/" : ""}guide`
  const principles = [
    { title: t("about.manifestTitle"), body: t("about.manifestBody"), icon: BookOpen },
    { title: t("about.lifecycleTitle"), body: t("about.lifecycleBody"), icon: Code2 },
    { title: t("about.safetyTitle"), body: t("about.safetyBody"), icon: ShieldCheck },
  ] as const
  return (
    <div className="space-y-12">
      <PageHeader eyebrow={t("about.eyebrow")} title={t("about.title")} description={t("about.description")} />
      <section className="grid border-y md:grid-cols-3 md:divide-x">
        {principles.map(({ title, body, icon: Icon }) => (
          <article key={title} className="border-b px-1 py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
            <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="mt-5 text-base font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 border-b pb-10 md:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">ReliaForge</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{t("about.startTitle")}</h2>
        </div>
        <div>
          <ol className="space-y-4 text-sm leading-6 text-muted">
            {[t("about.stepBackend"), t("about.stepPlugins"), t("about.stepTemplate")].map((step, index) => (
              <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 border-t pt-4 first:border-t-0 first:pt-0">
                <span className="font-mono text-xs text-accent">0{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap gap-5 text-sm font-medium text-accent">
            <a className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2" href={`${guideRoot}/getting-started.html`}>{t("about.quickStartLink")}</a>
            <a className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2" href={`${guideRoot}/plugin-development.html`}>{t("about.pluginGuideLink")}</a>
          </div>
          <p className="mt-7 text-xs text-muted">{t("about.copyright")}</p>
        </div>
      </section>
    </div>
  )
}
