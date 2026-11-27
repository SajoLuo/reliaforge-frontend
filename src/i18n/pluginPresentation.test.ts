import { describe, expect, it } from "vitest"
import { translate } from "@/i18n/messages"
import { pluginPresentation } from "@/i18n/pluginPresentation"
import type { PluginView } from "@/types/plugin"

const runbook: PluginView = {
  id: "runbook",
  name: "Runbook Preview",
  version: "1.0.0",
  description: "Builds deterministic, read-only runbook previews from typed plugin capabilities.",
  api_version: "v1",
  state: "running",
  available_actions: [],
  dependencies: [{ id: "demo", version: "^1.0.0", optional: false }],
  capabilities: ["runbook.preview"],
  settings_schema: { type: "object", properties: { title: { type: "string" } } },
  frontend: {
    category: "Examples",
    ui_mode: "none",
    nav: [],
    provides_themes: [],
    entry_url: null,
    style_url: null,
  },
  health: { status: "healthy", details: null },
}

describe("pluginPresentation", () => {
  it("localizes only display copy while the contract object stays canonical", () => {
    const localized = pluginPresentation(runbook, (key, values) => translate("zh", key, values), { locale: "zh" })

    expect(localized).toEqual({
      name: "运行手册预览",
      description: "只读运行手册预览插件。",
      category: "示例",
    })
    expect(runbook).toMatchObject({
      id: "runbook",
      name: "Runbook Preview",
      capabilities: ["runbook.preview"],
      settings_schema: { properties: { title: { type: "string" } } },
    })
  })

  it("supports optional localized plugin meta overrides without altering backend fields", () => {
    const custom = { ...runbook, id: "proxmox", name: "Proxmox VE", description: "Backend description" }
    expect(
      pluginPresentation(custom, (key, values) => translate("zh", key, values), {
        locale: "zh",
        meta: {
          name: "Proxmox",
          nameZh: "Proxmox 虚拟化",
          description: "PVE nodes and guests",
          descriptionZh: "管理 PVE 节点与虚拟机",
        },
      }),
    ).toMatchObject({
      name: "Proxmox 虚拟化",
      description: "管理 PVE 节点与虚拟机",
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
