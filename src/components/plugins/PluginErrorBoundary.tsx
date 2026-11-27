import { Component, type ReactNode } from "react"
import { StatePanel } from "@/components/common/StatePanel"
import { useLocale } from "@/i18n/useLocale"

export interface PluginErrorBoundaryProps {
  pluginId: string
  children: ReactNode
}

interface PluginErrorBoundaryState {
  failed: boolean
}

export class PluginErrorBoundary extends Component<
  PluginErrorBoundaryProps,
  PluginErrorBoundaryState
> {
  state: PluginErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): PluginErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error): void {
    console.error(`ReliaForge plugin "${this.props.pluginId}" render failure`, error)
  }

  componentDidUpdate(prevProps: PluginErrorBoundaryProps): void {
    if (prevProps.pluginId !== this.props.pluginId && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <PluginCrashFallback pluginId={this.props.pluginId} />
    }
    return this.props.children
  }
}

function PluginCrashFallback({ pluginId }: { pluginId: string }) {
  const { t } = useLocale()
  return (
    <StatePanel
      kind="error"
      title={t("workspace.pluginCrashTitle")}
      description={t("workspace.pluginCrashDescription", { pluginId })}
    />
  )
}
