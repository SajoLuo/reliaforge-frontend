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
      <div className="max-w-md rounded-lg border border-line bg-panel p-6 text-center shadow-panel">
        <h1 className="text-lg font-semibold text-ink">{t("error.title")}</h1>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex h-8 items-center justify-center rounded-md border border-line bg-panel px-3 text-xs font-medium text-ink transition-colors hover:bg-neutral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("common.refresh")}
        </button>
      </div>
    </main>
  )
}
