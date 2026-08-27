import type { Translator } from "@/i18n/types"
import type { PluginView } from "@/types/plugin"

export interface PluginPresentation {
  name: string
  description: string
  category: string
}

export function pluginPresentation(plugin: PluginView, t: Translator): PluginPresentation {
  const knownFixture = plugin.id === "demo"
    ? {
        canonicalName: "Demo",
        canonicalDescription: "A side-effect-free greeting plugin that demonstrates the public lifecycle.",
        nameKey: "fixture.demoName" as const,
        descriptionKey: "fixture.demoDescription" as const,
      }
    : plugin.id === "runbook"
      ? {
          canonicalName: "Runbook Preview",
          canonicalDescription: "Builds deterministic, read-only runbook previews from typed plugin capabilities.",
          nameKey: "fixture.runbookName" as const,
          descriptionKey: "fixture.runbookDescription" as const,
        }
      : null

  return {
    name: knownFixture && plugin.name === knownFixture.canonicalName ? t(knownFixture.nameKey) : plugin.name,
    description: knownFixture && plugin.description === knownFixture.canonicalDescription
      ? t(knownFixture.descriptionKey)
      : plugin.description,
    category: knownFixture && plugin.frontend.category === "Examples"
      ? t("fixture.examples")
      : plugin.frontend.category || t("common.extension"),
  }
}
