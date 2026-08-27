import { BookOpen, Code2, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"

export function AboutPage() {
  const { t } = useLocale()
  const principles = [
    { title: t("about.manifestTitle"), body: t("about.manifestBody"), icon: BookOpen },
    { title: t("about.lifecycleTitle"), body: t("about.lifecycleBody"), icon: Code2 },
    { title: t("about.safetyTitle"), body: t("about.safetyBody"), icon: ShieldCheck },
  ] as const
  return (
    <div className="space-y-9">
      <PageHeader eyebrow={t("about.eyebrow")} title={t("about.title")} description={t("about.description")} />
      <section className="grid gap-5 md:grid-cols-3">
        {principles.map(({ title, body, icon: Icon }) => (
          <Card key={title}>
            <CardContent>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h2 className="mt-5 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold">{t("about.startTitle")}</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>{t("about.stepBackend")}</li>
            <li>{t("about.stepPlugins")}</li>
            <li>{t("about.stepTemplate")}</li>
          </ol>
          <p className="mt-5 text-sm text-muted">{t("about.copyright")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
