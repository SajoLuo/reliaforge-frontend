import { describe, expect, it } from "vitest"
import { resolveBuildMode } from "@/config/buildMode"

describe("resolveBuildMode", () => {
  it("selects the static demo only for the explicit demo mode", () => {
    expect(resolveBuildMode("demo")).toBe("demo")
  })

  it.each(["development", "production", "test", ""])(
    "keeps %s builds on the normal runtime contract",
    (mode) => {
      expect(resolveBuildMode(mode)).toBe("normal")
    },
  )
})
