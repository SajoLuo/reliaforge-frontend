import { describe, expect, it } from "vitest"
import { demoApi } from "@/api/demoAdapter"

describe("demoApi", () => {
  it("returns a validated, internally consistent read-only platform snapshot", async () => {
    const [status, catalog] = await Promise.all([
      demoApi.getPlatformStatus(),
      demoApi.listPlugins(),
    ])

    expect(status.plugins).toEqual({
      total: 8,
      running: 8,
      degraded: 0,
      stopped: 0,
      error: 0,
    })
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual([
      "demo",
      "runbook",
      "infra_overview",
      "proxmox",
      "kubernetes",
      "gitops_argocd",
      "observability",
      "ops_audit",
    ])
    expect(catalog.plugins.every((plugin) => plugin.available_actions.length === 0)).toBe(true)
    expect(catalog.plugins[1].dependencies).toEqual([
      { id: "demo", version: "^1.0.0", optional: false },
    ])
    expect(catalog.plugins[1].health.details).toEqual({ service_running: true })
    expect(catalog.plugins[2].dependencies.every((dep) => dep.optional)).toBe(true)
    expect(catalog.plugins[2].frontend.nav[0]).toMatchObject({
      label: "Overview",
      label_zh: "总览",
      section: "workspace",
    })
  })

  it("returns independent objects so consumers cannot mutate the fixture", async () => {
    const first = await demoApi.listPlugins()
    first.plugins[0].settings_schema.tampered = true
    first.plugins.push(first.plugins[0])

    const second = await demoApi.listPlugins()
    expect(second.plugins).toHaveLength(8)
    expect(second.plugins[0].settings_schema).not.toHaveProperty("tampered")
  })

  it("reports missing plugins and rejects lifecycle writes", async () => {
    await expect(demoApi.getPlugin("missing")).rejects.toThrow("Demo plugin not found: missing")
    await expect(demoApi.runPluginAction("demo", "stop")).rejects.toThrow(
      "Lifecycle actions are unavailable in the read-only demo.",
    )
  })

  it("honors an already aborted request", async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(demoApi.listPlugins(controller.signal)).rejects.toHaveProperty("name", "AbortError")
  })
})
