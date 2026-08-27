export type BuildMode = "normal" | "demo"

export function resolveBuildMode(mode: string): BuildMode {
  return mode === "demo" ? "demo" : "normal"
}

export const buildMode = resolveBuildMode(import.meta.env.MODE)
export const isDemo = buildMode === "demo"
