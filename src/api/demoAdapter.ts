import type { ReliaForgeApi } from "@/api/adapter"
import {
  parsePlatformStatusResponse,
  parsePluginListResponse,
  parsePluginView,
} from "@/api/contracts"

const demoCatalog = parsePluginListResponse({
  plugins: [
    {
      id: "demo",
      name: "Demo",
      version: "1.0.0",
      description: "A side-effect-free greeting plugin that demonstrates the public lifecycle.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: ["demo.greeting"],
      settings_schema: {
        additionalProperties: false,
        description: "Typed settings loaded only from the public demo prefix.",
        properties: {
          greeting: {
            default: "Hello from ReliaForge",
            maxLength: 120,
            minLength: 1,
            title: "Greeting",
            type: "string",
          },
          audience: {
            default: "operator",
            maxLength: 80,
            minLength: 1,
            title: "Audience",
            type: "string",
          },
        },
        title: "DemoSettings",
        type: "object",
      },
      frontend: { category: "Examples" },
      health: {
        status: "healthy",
        details: { service_running: true },
      },
    },
    {
      id: "runbook",
      name: "Runbook Preview",
      version: "1.0.0",
      description: "Builds deterministic, read-only runbook previews from typed plugin capabilities.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [{ id: "demo", version: "^1.0.0" }],
      capabilities: ["runbook.preview"],
      settings_schema: {
        additionalProperties: false,
        description: "Text-only preview configuration with deterministic ordering.",
        properties: {
          title: {
            default: "Routine service check",
            maxLength: 100,
            minLength: 1,
            title: "Title",
            type: "string",
          },
          steps: {
            default: [
              "Review the current service health snapshot.",
              "Confirm the intended change and its rollback path.",
              "Record the preview for operator review.",
            ],
            items: {
              maxLength: 300,
              minLength: 1,
              type: "string",
            },
            maxItems: 10,
            minItems: 1,
            title: "Steps",
            type: "array",
          },
        },
        title: "RunbookSettings",
        type: "object",
      },
      frontend: { category: "Examples" },
      health: {
        status: "healthy",
        details: { service_running: true },
      },
    },
  ],
})

const demoStatus = parsePlatformStatusResponse({
  status: "healthy",
  version: "0.1.0",
  plugins: { total: 2, running: 2, degraded: 0, stopped: 0, error: 0 },
})

function checkSignal(signal?: AbortSignal) {
  signal?.throwIfAborted()
}

export const demoApi: ReliaForgeApi = {
  async getPlatformStatus(signal) {
    checkSignal(signal)
    return parsePlatformStatusResponse(demoStatus)
  },

  async listPlugins(signal) {
    checkSignal(signal)
    return parsePluginListResponse(demoCatalog)
  },

  async getPlugin(pluginId, signal) {
    checkSignal(signal)
    const plugin = demoCatalog.plugins.find((candidate) => candidate.id === pluginId)
    if (!plugin) throw new Error(`Demo plugin not found: ${pluginId}`)
    return parsePluginView(plugin)
  },

  async runPluginAction() {
    throw new Error("Lifecycle actions are unavailable in the read-only demo.")
  },
}
