import type { PluginMeta } from "@reliaforge/plugin-sdk"
import type { Locale, MessageKey } from "@/i18n/messages"
import type { Translator } from "@/i18n/types"
import type { PluginView } from "@/types/plugin"

export interface PluginPresentation {
  name: string
  description: string
  category: string
}

export interface PluginPresentationOptions {
  locale?: Locale
  meta?: PluginMeta
}

interface FixtureSpec {
  canonicalName: string
  canonicalDescription: string
  nameKey: MessageKey
  descriptionKey: MessageKey
}

const KNOWN_FIXTURES: Record<string, FixtureSpec> = {
  demo: {
    canonicalName: "Demo",
    canonicalDescription: "A side-effect-free greeting plugin that demonstrates the public lifecycle.",
    nameKey: "fixture.demoName",
    descriptionKey: "fixture.demoDescription",
  },
  runbook: {
    canonicalName: "Runbook Preview",
    canonicalDescription: "Builds deterministic, read-only runbook previews from typed plugin capabilities.",
    nameKey: "fixture.runbookName",
    descriptionKey: "fixture.runbookDescription",
  },
}

function localizedMetaField(
  locale: Locale,
  meta: PluginMeta | undefined,
  enKey: "name" | "description",
  zhKey: "nameZh" | "descriptionZh",
): string | undefined {
  if (!meta) return undefined
  return locale === "zh" ? (meta[zhKey] ?? meta[enKey]) : meta[enKey]
}

function resolveCategory(plugin: PluginView, hasFixture: boolean, t: Translator): string {
  if (hasFixture && plugin.frontend.category === "Examples") return t("fixture.examples")
  return plugin.frontend.category || t("common.extension")
}

function resolveText(
  metaText: string | undefined,
  rawText: string,
  canonicalText: string | undefined,
  key: MessageKey | undefined,
  t: Translator,
): string {
  if (metaText) return metaText
  if (key && rawText === canonicalText) return t(key)
  return rawText
}

export function pluginPresentation(
  plugin: PluginView,
  t: Translator,
  options: PluginPresentationOptions = {},
): PluginPresentation {
  const { locale = "en", meta } = options
  const fixture = KNOWN_FIXTURES[plugin.id]
  const canonicalName = fixture ? fixture.canonicalName : undefined
  const nameKey = fixture ? fixture.nameKey : undefined
  const canonicalDesc = fixture ? fixture.canonicalDescription : undefined
  const descKey = fixture ? fixture.descriptionKey : undefined

  return {
    name: resolveText(
      localizedMetaField(locale, meta, "name", "nameZh"),
      plugin.name,
      canonicalName,
      nameKey,
      t,
    ),
    description: resolveText(
      localizedMetaField(locale, meta, "description", "descriptionZh"),
      plugin.description,
      canonicalDesc,
      descKey,
      t,
    ),
    category: resolveCategory(plugin, Boolean(fixture), t),
  }
}
