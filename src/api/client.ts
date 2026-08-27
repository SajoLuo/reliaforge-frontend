import axios from "axios"

const configuredBaseUrl = import.meta.env.VITE_RELIAFORGE_API_URL?.trim()

export function buildApiBaseUrl(baseUrl: string | undefined): string {
  const normalized = baseUrl?.trim().replace(/\/+$/, "")
  return normalized ? `${normalized}/api/v1` : "/api/v1"
}

export const api = axios.create({
  baseURL: buildApiBaseUrl(configuredBaseUrl),
  timeout: 10_000,
  withCredentials: false,
  headers: { Accept: "application/json" },
})
