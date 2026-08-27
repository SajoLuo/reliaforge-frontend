import { Component, type ReactNode } from "react"
import { useLocale } from "@/i18n/useLocale"

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  failed: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error): void {
    console.error("ReliaForge render failure", error)
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return <LocalizedErrorFallback />
  }
}

function LocalizedErrorFallback() {
  const { t } = useLocale()
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-6" role="alert">
      <div className="max-w-lg rounded-2xl border bg-panel p-8 text-center shadow-lift">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger">{t("error.eyebrow")}</p>
        <h1 className="mt-3 text-2xl font-black">{t("error.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {t("error.description")}
        </p>
      </div>
    </main>
  )
}
