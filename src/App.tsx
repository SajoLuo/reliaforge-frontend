import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { semanticPath } from "@/i18n/locale"
import { AboutPage } from "@/pages/AboutPage"
import { OverviewPage } from "@/pages/OverviewPage"
import { PluginDetailPage } from "@/pages/PluginDetailPage"
import { PluginsPage } from "@/pages/PluginsPage"
import { HomePage, PluginWorkspacePage } from "@/pages/PluginWorkspacePage"
import { PluginRuntimeProvider } from "@/runtime/PluginRuntimeProvider"

function LegacyZhRedirect() {
  const location = useLocation()
  const target = semanticPath(location.pathname)
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}

export function App() {
  return (
    <PluginRuntimeProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/platform" element={<OverviewPage mode="platform" />} />
          <Route path="/plugins" element={<PluginsPage />} />
          <Route path="/plugins/:pluginId" element={<PluginDetailPage />} />
          <Route path="/p/:pluginId/*" element={<PluginWorkspacePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/zh" element={<LegacyZhRedirect />} />
          <Route path="/zh/*" element={<LegacyZhRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </PluginRuntimeProvider>
  )
}
