import { describe, expect, it } from "vitest"
import { pluginPresentation } from "@/i18n/pluginPresentation"
import { translate } from "@/i18n/messages"
import type { PluginView } from "@/types/plugin"

const runbook: PluginView = {
  id: "runbook",
  name: "Runbook Preview",
  version: "1.0.0",
  description: "Builds deterministic, read-only runbook previews from typed plugin capabilities.",
  api_version: "v1",
  state: "running",
  available_actions: [],
  dependencies: [{ id: "demo", version: "^1.0.0" }],
  capabilities: ["runbook.preview"],
  settings_schema: { type: "object", properties: { title: { type: "string" } } },
  frontend: { category: "Examples" },
  health: { status: "healthy", details: null },
}

describe("pluginPresentation", () => {
  it("localizes only display copy while the contract object stays canonical", () => {
    const localized = pluginPresentation(runbook, (key, values) => translate("zh", key, values))

    expect(localized).toEqual({
      name: "运行手册预览",
      description: "根据类型化插件能力生成确定性的只读运行手册预览。",
      category: "示例",
    })
    expect(runbook).toMatchObject({
      id: "runbook",
      name: "Runbook Preview",
      capabilities: ["runbook.preview"],
      settings_schema: { properties: { title: { type: "string" } } },
    })
  })

  it("does not rewrite arbitrary backend-provided plugin prose", () => {
    const custom = { ...runbook, id: "custom", name: "团队插件", description: "Owned by its backend manifest." }
    expect(pluginPresentation(custom, (key, values) => translate("zh", key, values))).toMatchObject({
      name: "团队插件",
      description: "Owned by its backend manifest.",
      category: "Examples",
    })
  })
})
