export interface ReliaForgePluginBuildOptions {
  pluginId: string
  entry: string
  outDir?: string
}

export interface ReliaForgeViteBuildPlugin {
  name: string
  apply: "build"
  enforce: "pre"
  config: () => {
    define: Record<string, string>
    build: {
      outDir: string
      emptyOutDir: boolean
      copyPublicDir: boolean
      cssCodeSplit: boolean
      lib: {
        entry: string
        formats: ["es"]
        fileName: () => string
        cssFileName: string
      }
    }
  }
  resolveId: (source: string) => string | null
  load: (id: string) => string | null
}

export interface ReliaForgeViteCssLayerPlugin {
  name: string
  apply: "build"
  enforce: "post"
  generateBundle: (
    options: unknown,
    bundle: Record<string, { type: string; fileName: string; source?: string | Uint8Array }>,
  ) => Promise<void>
}

export declare function reliaforgePluginBuild(
  options: ReliaForgePluginBuildOptions,
): [ReliaForgeViteBuildPlugin, ReliaForgeViteCssLayerPlugin]
