import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { useLocale } from "@/i18n/useLocale"
import { AboutPage } from "@/pages/AboutPage"
import { OverviewPage } from "@/pages/OverviewPage"
import { PluginDetailPage } from "@/pages/PluginDetailPage"
import { PluginsPage } from "@/pages/PluginsPage"
import { PluginWorkspacePage } from "@/pages/PluginWorkspacePage"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"
import { ThemeProvider } from "@/theme/ThemeProvider"

const routeDefinitions = [
  { path: "/", element: <OverviewPage /> },
  { path: "/plugins", element: <PluginsPage /> },
  { path: "/plugins/:pluginId", element: <PluginDetailPage /> },
  { path: "/p/:pluginId/*", element: <PluginWorkspacePage /> },
  { path: "/about", element: <AboutPage /> },
] as const

export function App() {
  const { pathFor } = useLocale()
  return (
    <ThemeProvider>
      <PluginRuntimeProvider>
        <AppShell>
          <Routes>
            {routeDefinitions.flatMap(({ path, element }) => [
              <Route key={path} path={path} element={element} />,
              <Route key={`/zh${path}`} path={path === "/" ? "/zh/" : `/zh${path}`} element={element} />,
            ])}
            <Route path="*" element={<Navigate to={pathFor("/")} replace />} />
          </Routes>
        </AppShell>
      </PluginRuntimeProvider>
    </ThemeProvider>
  )
}
