import axios from "axios"

interface ErrorPayload {
  detail?: unknown
}

function authorizationMessage(status: number | undefined): string | null {
  if (status === 401) return "Authentication is required."
  if (status === 403) return "You do not have permission to perform this action."
  return null
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string" && detail.trim()) return detail
    return authorizationMessage(error.response?.status) ?? fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}
