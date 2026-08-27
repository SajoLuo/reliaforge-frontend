import type { ReactNode } from "react"
import { BrowserRouter, HashRouter } from "react-router-dom"
import { buildMode, type BuildMode } from "@/config/buildMode"

export interface AppRouterProps {
  children: ReactNode
  mode?: BuildMode
}

export function AppRouter({ children, mode = buildMode }: AppRouterProps) {
  const Router = mode === "demo" ? HashRouter : BrowserRouter
  return <Router>{children}</Router>
}
