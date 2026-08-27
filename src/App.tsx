import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { AboutPage } from "@/pages/AboutPage"
import { OverviewPage } from "@/pages/OverviewPage"
import { PluginDetailPage } from "@/pages/PluginDetailPage"
import { PluginsPage } from "@/pages/PluginsPage"

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/plugins/:pluginId" element={<PluginDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
