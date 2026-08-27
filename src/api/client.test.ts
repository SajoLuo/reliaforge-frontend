import { describe, expect, it } from "vitest"
import { buildApiBaseUrl } from "@/api/client"

describe("buildApiBaseUrl", () => {
  it("uses a same-origin API path when no deployment URL is configured", () => {
    expect(buildApiBaseUrl(undefined)).toBe("/api/v1")
    expect(buildApiBaseUrl("   ")).toBe("/api/v1")
  })

  it("normalizes configured deployment URLs", () => {
    expect(buildApiBaseUrl("https://ops.example.test///")).toBe("https://ops.example.test/api/v1")
  })
})
