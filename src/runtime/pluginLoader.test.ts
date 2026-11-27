import { afterEach, describe, expect, it, vi } from "vitest"
import {
  injectPluginStyle,
  loadPluginModule,
  removePluginStyle,
  resolvePluginAssetUrl,
  validatePluginModule,
} from "@/runtime/pluginLoader"

afterEach(() => {
  document.head.querySelectorAll("link[data-rf-plugin-style]").forEach((node) => node.remove())
})

describe("pluginLoader", () => {
  it("resolves asset URLs strictly against the API origin and plugin ui prefix", () => {
    const resolved = resolvePluginAssetUrl(
      "/api/v1/plugins/proxmox/ui/entry.js?v=abc123def456",
      "proxmox",
      "https://api.example.com",
    )
    expect(resolved).toBe("https://api.example.com/api/v1/plugins/proxmox/ui/entry.js?v=abc123def456")

    expect(() =>
      resolvePluginAssetUrl(
        "https://cdn.example.com/api/v1/plugins/proxmox/ui/entry.js",
        "proxmox",
        "https://api.example.com",
      ),
    ).toThrow("must match the backend API origin")

    expect(() =>
      resolvePluginAssetUrl(
        "/api/v1/plugins/other/ui/entry.js",
        "proxmox",
        "https://api.example.com",
      ),
    ).toThrow("must reside under /api/v1/plugins/proxmox/ui/")

    expect(() =>
      resolvePluginAssetUrl("ftp://api.example.com/api/v1/plugins/proxmox/ui/entry.js", "proxmox", "https://api.example.com"),
    ).toThrow("unsupported protocol")
  })

  it("validates module apiVersion and plugin id", () => {
    const valid = validatePluginModule(
      { default: { apiVersion: "v1", id: "proxmox", routes: [] } },
      "proxmox",
    )
    expect(valid.id).toBe("proxmox")

    expect(() => validatePluginModule({ apiVersion: "v2", id: "proxmox" }, "proxmox"))
      .toThrow('apiVersion must be "v1"')
    expect(() => validatePluginModule({ default: { apiVersion: "v1", id: "other" } }, "proxmox"))
      .toThrow('does not match "proxmox"')
  })

  it("injects and cleans up stylesheet links during loadPluginModule", async () => {
    const importModule = vi.fn().mockResolvedValue({
      default: { apiVersion: "v1", id: "proxmox", routes: [] },
    })

    const plugin = await loadPluginModule({
      pluginId: "proxmox",
      entryUrl: "/api/v1/plugins/proxmox/ui/entry.js?v=111",
      styleUrl: "/api/v1/plugins/proxmox/ui/style.css?v=111",
      apiOrigin: "https://ops.example.com",
      importModule,
    })

    expect(plugin.id).toBe("proxmox")
    expect(importModule).toHaveBeenCalledWith("https://ops.example.com/api/v1/plugins/proxmox/ui/entry.js?v=111")
    const link = document.head.querySelector<HTMLLinkElement>('link[data-rf-plugin-style="proxmox"]')
    expect(link?.href).toBe("https://ops.example.com/api/v1/plugins/proxmox/ui/style.css?v=111")

    injectPluginStyle("proxmox", "https://ops.example.com/api/v1/plugins/proxmox/ui/style.css?v=222")
    expect(document.head.querySelector<HTMLLinkElement>('link[data-rf-plugin-style="proxmox"]')?.href)
      .toBe("https://ops.example.com/api/v1/plugins/proxmox/ui/style.css?v=222")

    removePluginStyle("proxmox")
    expect(document.head.querySelector('link[data-rf-plugin-style="proxmox"]')).toBeNull()
  })
})
