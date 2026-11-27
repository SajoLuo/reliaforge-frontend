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
      dependencies: [{ id: "demo", version: "^1.0.0", optional: false }],
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
    {
      id: "infra_overview",
      name: "Infra Overview",
      version: "1.0.0",
      description: "Aggregates topology and service health across optional infrastructure providers.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [
        { id: "proxmox", version: "^1.0.0", optional: true },
        { id: "kubernetes", version: "^1.0.0", optional: true },
        { id: "observability", version: "^1.0.0", optional: true },
        { id: "gitops_argocd", version: "^1.0.0", optional: true },
        { id: "ops_audit", version: "^1.0.0", optional: true },
      ],
      capabilities: ["infra_overview.topology"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          title: { type: "string", default: "Operations Portal" },
        },
        title: "InfraOverviewSettings",
        type: "object",
      },
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [
          {
            label: "Overview",
            label_zh: "总览",
            path: "",
            icon: "layers",
            order: 10,
            section: "workspace",
          },
        ],
      },
      health: { status: "healthy", details: { providers_configured: 0 } },
    },
    {
      id: "proxmox",
      name: "Proxmox VE",
      version: "1.0.0",
      description: "Inspects Proxmox nodes, guests, storage pools, tasks, and LXC terminals.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [{ id: "ops_audit", version: "^1.0.0", optional: true }],
      capabilities: ["proxmox.inventory", "proxmox.tasks", "proxmox.actions"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          read_only: { type: "boolean", default: true },
          base_url: { type: "string", default: "https://pve.example.com:8006" },
        },
        title: "ProxmoxSettings",
        type: "object",
      },
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [
          {
            label: "Proxmox",
            label_zh: "Proxmox",
            path: "",
            icon: "server",
            order: 20,
            section: "workspace",
          },
        ],
      },
      health: { status: "healthy", details: { read_only: true } },
    },
    {
      id: "kubernetes",
      name: "Kubernetes",
      version: "1.0.0",
      description: "Inspects cluster nodes, workloads, pod logs, and scoped operational actions.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [{ id: "ops_audit", version: "^1.0.0", optional: true }],
      capabilities: ["kubernetes.inventory", "kubernetes.logs", "kubernetes.actions"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          read_only: { type: "boolean", default: true },
          api_server: { type: "string", default: "https://kubernetes.default.svc" },
        },
        title: "KubernetesSettings",
        type: "object",
      },
      frontend: {
        category: "Infrastructure",
        ui_mode: "esm",
        nav: [
          {
            label: "Kubernetes",
            label_zh: "Kubernetes",
            path: "",
            icon: "boxes",
            order: 30,
            section: "workspace",
          },
        ],
      },
      health: { status: "healthy", details: { read_only: true } },
    },
    {
      id: "gitops_argocd",
      name: "Argo CD GitOps",
      version: "1.0.0",
      description: "Tracks Argo CD application sync status, out-of-sync resources, and controlled syncs.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [{ id: "ops_audit", version: "^1.0.0", optional: true }],
      capabilities: ["argocd.applications", "argocd.actions"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          argocd_url: { type: "string", default: "https://argocd.example.com" },
          read_only: { type: "boolean", default: true },
        },
        title: "ArgoCdSettings",
        type: "object",
      },
      frontend: {
        category: "Delivery",
        ui_mode: "esm",
        nav: [
          {
            label: "GitOps",
            label_zh: "GitOps",
            path: "",
            icon: "git-branch",
            order: 40,
            section: "workspace",
          },
        ],
      },
      health: { status: "healthy", details: { read_only: true } },
    },
    {
      id: "observability",
      name: "Observability",
      version: "1.0.0",
      description: "Queries Prometheus metrics, Loki logs, and Alertmanager alerts and silences.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [{ id: "ops_audit", version: "^1.0.0", optional: true }],
      capabilities: ["observability.logs", "observability.metrics", "observability.alerts"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          prometheus_url: { type: "string", default: "https://metrics.example.com" },
          loki_url: { type: "string", default: "https://logs.example.com" },
        },
        title: "ObservabilitySettings",
        type: "object",
      },
      frontend: {
        category: "Observability",
        ui_mode: "esm",
        nav: [
          {
            label: "Observability",
            label_zh: "可观测性",
            path: "",
            icon: "activity",
            order: 50,
            section: "workspace",
          },
        ],
      },
      health: { status: "healthy", details: { read_only: true } },
    },
    {
      id: "ops_audit",
      name: "Operations Audit",
      version: "1.0.0",
      description: "Records platform lifecycle transitions and operator actions in an audit timeline.",
      api_version: "v1",
      state: "running",
      available_actions: [],
      dependencies: [],
      capabilities: ["ops_audit.recorder"],
      settings_schema: {
        additionalProperties: false,
        properties: {
          retention_limit: { type: "integer", default: 10000 },
        },
        title: "OpsAuditSettings",
        type: "object",
      },
      frontend: {
        category: "Governance",
        ui_mode: "esm",
        nav: [
          {
            label: "Audit",
            label_zh: "审计",
            path: "",
            icon: "scroll-text",
            order: 10,
            section: "operations",
          },
        ],
      },
      health: { status: "healthy", details: { persistent: false } },
    },
  ],
})

const demoStatus = parsePlatformStatusResponse({
  status: "healthy",
  version: "0.1.0",
  plugins: { total: 8, running: 8, degraded: 0, stopped: 0, error: 0 },
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
