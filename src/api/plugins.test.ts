import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/api/client"
import { getPlugin, listPlugins, runPluginAction } from "@/api/plugins"
import type { PluginView } from "@/types/plugin"

afterEach(() => vi.restoreAllMocks())

describe("plugin API", () => {
  it("returns the typed plugin list payload", async () => {
    const payload = { plugins: [] }
    vi.spyOn(api, "get").mockResolvedValue({ data: payload })
    await expect(listPlugins()).resolves.toEqual(payload)
    expect(api.get).toHaveBeenCalledWith("/plugins", { signal: undefined })
  })

  it("uses versioned detail and lifecycle action paths", async () => {
    const plugin: PluginView = {
      id: "sample_tool",
      name: "Sample",
      version: "0.1.0",
      description: "Sample",
      api_version: "v1",
      state: "running" as const,
      available_actions: ["stop", "restart"],
      dependencies: [{ id: "provider", version: "^1.0.0" }],
      capabilities: [],
      settings_schema: {},
      frontend: { category: null },
      health: { status: "healthy", details: null },
    }
    vi.spyOn(api, "get").mockResolvedValue({ data: plugin })
    vi.spyOn(api, "post").mockResolvedValue({ data: plugin })
    await getPlugin(plugin.id)
    await runPluginAction(plugin.id, "restart")
    expect(api.get).toHaveBeenCalledWith("/plugins/sample_tool", { signal: undefined })
    expect(api.post).toHaveBeenCalledWith("/plugins/sample_tool/restart", undefined, {
      signal: undefined,
      timeout: 310_000,
    })
  })
})
