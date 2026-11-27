import { lazy, Suspense } from "react"
import type { TerminalPaneProps } from "@reliaforge/plugin-sdk"
import { StatePanel } from "@/components/common/StatePanel"
import { useLocale } from "@/i18n/useLocale"

const LazyTerminalPaneImpl = lazy(() => import("@/components/ops/TerminalPaneImpl"))

export function TerminalPane(props: TerminalPaneProps) {
  const { t } = useLocale()
  return (
    <Suspense
      fallback={
        <StatePanel
          kind="loading"
          title={t("ops.terminal.title")}
          description={t("ops.terminal.connecting")}
        />
      }
    >
      <LazyTerminalPaneImpl {...props} />
    </Suspense>
  )
}
