import { describe, expect, it } from "vitest"
import { actionOutcomeIsUnknown, apiErrorMessage } from "@/api/errors"

function axiosError(detail: unknown, status = 500): object {
  return { isAxiosError: true, response: { status, data: { detail } } }
}

describe("apiErrorMessage", () => {
  it("distinguishes rejected operations from uncertain transport and server outcomes", () => {
    expect(actionOutcomeIsUnknown(axiosError("Rejected", 409))).toBe(false)
    expect(actionOutcomeIsUnknown(axiosError("Unauthorized", 401))).toBe(false)
    expect(actionOutcomeIsUnknown(axiosError("Request timeout", 408))).toBe(true)
    expect(actionOutcomeIsUnknown(axiosError("Gateway timeout", 504))).toBe(true)
    expect(actionOutcomeIsUnknown({ isAxiosError: true })).toBe(true)
    expect(actionOutcomeIsUnknown(new Error("Invalid response after POST"))).toBe(true)
  })

  it("prefers a backend problem detail", () => {
    expect(apiErrorMessage(axiosError("Active dependents prevent stop."), "Fallback")).toBe("Active dependents prevent stop.")
  })

  it("falls back to a regular error message or the supplied default", () => {
    expect(apiErrorMessage(new Error("Network unavailable"), "Fallback")).toBe("Network unavailable")
    expect(apiErrorMessage(axiosError({ reason: "invalid" }), "Fallback")).toBe("Fallback")
  })

  it("maps authorization failures without exposing raw Axios messages", () => {
    expect(apiErrorMessage(axiosError(undefined, 401), "Fallback")).toBe("Authentication is required.")
    expect(apiErrorMessage(axiosError(undefined, 403), "Fallback")).toBe("You do not have permission to perform this action.")
  })

  it("uses caller-supplied authorization messages", () => {
    const messages = {
      authenticationRequired: "需要先登录。",
      permissionDenied: "你没有执行此操作的权限。",
    }
    expect(apiErrorMessage(axiosError(undefined, 401), "Fallback", messages)).toBe("需要先登录。")
    expect(apiErrorMessage(axiosError(undefined, 403), "Fallback", messages)).toBe("你没有执行此操作的权限。")
  })
})
