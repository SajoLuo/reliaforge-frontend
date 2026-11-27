const LAYER_ORDER = "rf-base, rf-sm, rf-md, rf-lg, rf-xl, rf-2xl"

const BREAKPOINT_LAYERS = new Map([
  ["640px", "rf-sm"],
  ["768px", "rf-md"],
  ["1024px", "rf-lg"],
  ["1280px", "rf-xl"],
  ["1536px", "rf-2xl"],
])

function resolveBreakpointLayer(params) {
  const match = /\(\s*min-width\s*:\s*(\d+px)\s*\)/i.exec(params)
  if (!match) return null
  return BREAKPOINT_LAYERS.get(match[1].toLowerCase()) ?? null
}

function isThemeScopedNode(node) {
  if (node.type === "rule" && typeof node.selector === "string") {
    return node.selector.includes("data-console-theme")
  }
  return false
}

/**
 * PostCSS plugin that places base utilities and responsive breakpoint queries
 * into ordered CSS Cascade Layers (`rf-base` < `rf-sm` < `rf-md` < `rf-lg` < `rf-xl` < `rf-2xl`)
 * so scoped plugin base utilities (`[data-rf-plugin] .flex-col`) never override
 * host responsive utilities (`.sm:flex-row`), and vice versa.
 */
export function reliaforgeBreakpointLayers() {
  return {
    postcssPlugin: "reliaforge-breakpoint-layers",
    OnceExit(root, { AtRule }) {
      const hasOrder = root.nodes.some(
        (node) => node.type === "atrule" && node.name === "layer" && node.params === LAYER_ORDER,
      )
      const nodesToProcess = [...root.nodes]
      let currentLayerName = null
      let currentLayerRule = null
      let layeredAny = false

      for (const node of nodesToProcess) {
        if (node.type === "comment") continue
        if (node.type === "atrule" && (node.name === "charset" || node.name === "import" || node.name === "keyframes" || node.name === "layer")) {
          currentLayerName = null
          currentLayerRule = null
          continue
        }
        if (isThemeScopedNode(node)) {
          currentLayerName = null
          currentLayerRule = null
          continue
        }

        let targetLayer = null
        if (node.type === "atrule" && node.name === "media") {
          const bpLayer = resolveBreakpointLayer(node.params)
          if (!bpLayer) {
            if (/prefers-color-scheme|prefers-reduced-motion/i.test(node.params)) {
              currentLayerName = null
              currentLayerRule = null
              continue
            }
            targetLayer = "rf-base"
          } else {
            targetLayer = bpLayer
          }
        } else if (node.type === "rule") {
          targetLayer = "rf-base"
        }

        if (!targetLayer) {
          currentLayerName = null
          currentLayerRule = null
          continue
        }

        layeredAny = true
        if (currentLayerRule && currentLayerName === targetLayer) {
          node.remove()
          currentLayerRule.append(node)
        } else {
          const layerWrap = new AtRule({ name: "layer", params: targetLayer })
          node.replaceWith(layerWrap)
          layerWrap.append(node)
          currentLayerName = targetLayer
          currentLayerRule = layerWrap
        }
      }
      if (layeredAny && !hasOrder) {
        root.prepend(new AtRule({ name: "layer", params: LAYER_ORDER }))
      }
    },
  }
}
reliaforgeBreakpointLayers.postcss = true
