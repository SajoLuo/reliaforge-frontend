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
  dependencies: [],
  capabilities: ["demo.greeting"],
  settings_schema: { type: "object", properties: {} },
  frontend: { category: "Examples" },
  health: { status: "healthy", details: null },
}

describe("API response contracts", () => {
  it("parses the plugin catalog and platform summary", () => {
    expect(parsePluginView(plugin).id).toBe("demo")
    expect(parsePluginListResponse({ plugins: [plugin] }).plugins).toHaveLength(1)
    expect(parsePlatformStatusResponse({
      status: "healthy",
      version: "0.1.0",
      plugins: { total: 1, running: 1, degraded: 0, stopped: 0, error: 0 },
    }).plugins.running).toBe(1)
  })

  it("rejects unknown actions, missing nested data, and inconsistent counts", () => {
    expect(() => parsePluginView({ ...plugin, available_actions: ["delete"] }))
      .toThrow("Invalid API response: plugin.available_actions.")
    expect(() => parsePluginView({ ...plugin, health: null }))
      .toThrow("Invalid API response: plugin.health.")
    expect(() => parsePlatformStatusResponse({
      status: "healthy",
      version: "0.1.0",
      plugins: { total: 2, running: 1, degraded: 0, stopped: 0, error: 0 },
    })).toThrow("Invalid API response: status.plugins.total.")
  })
})
