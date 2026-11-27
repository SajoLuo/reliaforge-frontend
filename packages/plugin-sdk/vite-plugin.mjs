import { HOST_MODULE_EXPORTS, SDK_VERSION } from "./src/host-exports.mjs"

const VIRTUAL_PREFIX = "\0reliaforge-host:"

function createHostShim(moduleId, pluginId) {
  const descriptor = HOST_MODULE_EXPORTS[moduleId]
  if (!descriptor) {
    throw new Error(`Unknown host module "${moduleId}" requested by plugin "${pluginId}".`)
  }
  const lines = [
    "const bridge = globalThis.__RELIAFORGE_HOST__;",
    `if (!bridge || bridge.sdkVersion !== ${JSON.stringify(SDK_VERSION)} || !bridge.modules || !bridge.modules[${JSON.stringify(moduleId)}]) {`,
    `  throw new Error(${JSON.stringify(`ReliaForge plugin "${pluginId}" requires host module "${moduleId}" (SDK v${SDK_VERSION}).`)});`,
    "}",
    `const mod = bridge.modules[${JSON.stringify(moduleId)}];`,
  ]
  if (descriptor.exports.length > 0) {
    lines.push(`export const { ${descriptor.exports.join(", ")} } = mod;`)
  }
  if (descriptor.hasDefault) {
    lines.push("export default mod.default ?? mod;")
  }
  return lines.join("\n")
}

/**
 * Configures Vite library ESM bundling for a ReliaForge console plugin and rewrites
 * host-provided runtime modules to destructure `window.__RELIAFORGE_HOST__`.
 */
export function reliaforgePluginBuild({ pluginId, entry, outDir = "dist" }) {
  if (!pluginId || typeof pluginId !== "string") {
    throw new Error("reliaforgePluginBuild requires a non-empty string pluginId.")
  }
  if (!entry || typeof entry !== "string") {
    throw new Error("reliaforgePluginBuild requires a non-empty string entry path.")
  }

  return {
    name: "reliaforge-plugin-build",
    apply: "build",
    enforce: "pre",
    config() {
      return {
        define: {
          "process.env.NODE_ENV": '"production"',
        },
        build: {
          outDir,
          emptyOutDir: true,
          copyPublicDir: false,
          cssCodeSplit: false,
          lib: {
            entry,
            formats: ["es"],
            fileName: () => "entry.js",
            cssFileName: "style",
          },
        },
      }
    },
    resolveId(source) {
      if (Object.prototype.hasOwnProperty.call(HOST_MODULE_EXPORTS, source)) {
        return `${VIRTUAL_PREFIX}${source}`
      }
      return null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null
      const moduleId = id.slice(VIRTUAL_PREFIX.length)
      return createHostShim(moduleId, pluginId)
    },
  }
}
