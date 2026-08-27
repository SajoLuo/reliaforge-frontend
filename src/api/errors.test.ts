import { describe, expect, it } from "vitest"
import { apiErrorMessage } from "@/api/errors"

function axiosError(detail: unknown, status = 500): object {
  return { isAxiosError: true, response: { status, data: { detail } } }
}

describe("apiErrorMessage", () => {
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
})
