import { describe, expect, it } from "vitest"
import {
  parsePlatformStatusResponse,
  parsePluginListResponse,
  parsePluginView,
} from "@/api/contracts"

const plugin = {
  id: "demo",
  name: "Demo",
  version: "1.0.0",
  description: "Neutral example",
  api_version: "v1",
  state: "running",
  available_actions: ["stop", "restart"],
  dependencies: [{ id: "base", version: "^1.0.0" }],
  capabilities: ["demo.greeting"],
  settings_schema: { type: "object", properties: {} },
  frontend: {
    category: "Examples",
    ui_mode: "esm",
    nav: [
      {
        label: "Demo UI",
        label_zh: "演示界面",
        path: "/overview",
        icon: "boxes",
        order: 20,
        section: "workspace",
      },
    ],
    provides_themes: ["demo-theme"],
    entry_url: "/api/v1/plugins/demo/ui/entry.js?v=abc123def456",
    style_url: "/api/v1/plugins/demo/ui/style.css?v=abc123def456",
  },
  health: { status: "healthy", details: null },
}

describe("API response contracts", () => {
  it("parses the plugin catalog, optional dependencies, and extended frontend view", () => {
    const parsed = parsePluginView(plugin)
    expect(parsed.id).toBe("demo")
    expect(parsed.dependencies).toEqual([{ id: "base", version: "^1.0.0", optional: false }])
    expect(parsed.frontend).toEqual({
      category: "Examples",
      ui_mode: "esm",
      nav: [
        {
          label: "Demo UI",
          label_zh: "演示界面",
          path: "/overview",
          icon: "boxes",
          order: 20,
          section: "workspace",
        },
      ],
      provides_themes: ["demo-theme"],
      entry_url: "/api/v1/plugins/demo/ui/entry.js?v=abc123def456",
      style_url: "/api/v1/plugins/demo/ui/style.css?v=abc123def456",
    })

    const optionalDep = parsePluginView({
      ...plugin,
      dependencies: [{ id: "audit", version: "^1.0.0", optional: true }],
      frontend: {},
    })
    expect(optionalDep.dependencies[0].optional).toBe(true)
    expect(optionalDep.frontend).toEqual({
      category: null,
      ui_mode: "none",
      nav: [],
      provides_themes: [],
      entry_url: null,
      style_url: null,
    })

    expect(parsePluginListResponse({ plugins: [plugin] }).plugins).toHaveLength(1)
    expect(parsePlatformStatusResponse({
      status: "healthy",
      version: "0.1.0",
      plugins: { total: 1, running: 1, degraded: 0, stopped: 0, error: 0 },
    }).plugins.running).toBe(1)
  })

  it("rejects unknown actions, invalid frontend metadata, and inconsistent counts", () => {
    expect(() => parsePluginView({ ...plugin, available_actions: ["delete"] }))
      .toThrow("Invalid API response: plugin.available_actions.")
    expect(() => parsePluginView({ ...plugin, dependencies: [{ id: "a", version: "1", optional: "yes" }] }))
      .toThrow("Invalid API response: plugin.dependencies.optional.")
    expect(() => parsePluginView({ ...plugin, frontend: { ui_mode: "schema" } }))
      .toThrow("Invalid API response: plugin.frontend.ui_mode.")
    expect(() => parsePluginView({ ...plugin, frontend: { nav: [{ label: "Bad", path: "/BadPath" }] } }))
      .toThrow("Invalid API response: plugin.frontend.nav.path.")
    expect(() => parsePluginView({ ...plugin, frontend: { nav: [{ label: "Bad", section: "invalid" }] } }))
      .toThrow("Invalid API response: plugin.frontend.nav.section.")
    expect(() => parsePluginView({ ...plugin, health: null }))
      .toThrow("Invalid API response: plugin.health.")
    expect(() => parsePlatformStatusResponse({
      status: "healthy",
      version: "0.1.0",
      plugins: { total: 2, running: 1, degraded: 0, stopped: 0, error: 0 },
    })).toThrow("Invalid API response: status.plugins.total.")
  })
})
