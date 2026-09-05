import axios from "axios"
import type { AxiosError } from "axios"

interface ErrorPayload {
  detail?: unknown
}

export interface AuthorizationMessages {
  authenticationRequired: string
  permissionDenied: string
}

const defaultAuthorizationMessages: AuthorizationMessages = {
  authenticationRequired: "Authentication is required.",
  permissionDenied: "You do not have permission to perform this action.",
}

export function actionOutcomeIsUnknown(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return true
  const status = error.response?.status
  return status === undefined || status === 408 || status >= 500
}

function authorizationMessage(
  status: number | undefined,
  messages: AuthorizationMessages,
): string | null {
  if (status === 401) return messages.authenticationRequired
  if (status === 403) return messages.permissionDenied
  return null
}

function axiosErrorMessage(
  error: AxiosError<ErrorPayload>,
  fallback: string,
  authorizationMessages: AuthorizationMessages,
): string {
  const detail = error.response?.data?.detail
  if (typeof detail === "string" && detail.trim()) return detail
  return authorizationMessage(error.response?.status, authorizationMessages) ?? fallback
}

export function apiErrorMessage(
  error: unknown,
  fallback: string,
  authorizationMessages: AuthorizationMessages = defaultAuthorizationMessages,
): string {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    return axiosErrorMessage(error, fallback, authorizationMessages)
  }
  return error instanceof Error && error.message ? error.message : fallback
}
