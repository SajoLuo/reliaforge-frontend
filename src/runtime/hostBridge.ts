import * as ReactNamespace from "react"
import * as ReactDomNamespace from "react-dom"
import * as ReactJsxRuntime from "react/jsx-runtime"
import * as ReactRouterNamespace from "react-router"
import * as ReactRouterDomNamespace from "react-router-dom"
import {
  HOST_MODULE_EXPORTS,
  SDK_VERSION,
  type HostModuleName,
  type ReliaForgeHostBridge,
} from "@reliaforge/plugin-sdk"
import { PageHeader } from "@/components/common/PageHeader"
import { StatePanel } from "@/components/common/StatePanel"
import { ConfirmActionDialog } from "@/components/ops/ConfirmActionDialog"
import { DataTable } from "@/components/ops/DataTable"
import { LogViewer } from "@/components/ops/LogViewer"
import { RelativeTime } from "@/components/ops/RelativeTime"
import { RowActions } from "@/components/ops/RowActions"
import { Sheet } from "@/components/ops/Sheet"
import { Sparkline } from "@/components/ops/Sparkline"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status, StatusBadge, StatusDot } from "@/components/ops/Status"
import { TerminalPane } from "@/components/ops/TerminalPane"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"
import { PluginLink, usePluginPath } from "@/runtime/pluginRouting"
import { apiFetch, createEventSource, createWebSocketUrl } from "@/runtime/sdkTransport"

function pickModuleExports(
  source: Record<string, unknown>,
  exportNames: readonly string[],
  includeDefault: boolean,
): Readonly<Record<string, unknown>> {
  const picked: Record<string, unknown> = {}
  for (const name of exportNames) {
    if (name in source) picked[name] = source[name]
  }
  if (includeDefault) {
    picked.default = "default" in source ? source.default : picked
  }
  return Object.freeze(picked)
}

export function buildHostBridge(): ReliaForgeHostBridge {
  const sdkRuntimeExports: Record<string, unknown> = {
    SDK_VERSION,
    HOST_MODULE_EXPORTS,
    Card,
    CardHeader,
    CardContent,
    Button,
    Badge,
    StatePanel,
    PageHeader,
    DataTable,
    Sheet,
    RowActions,
    Status,
    StatusBadge,
    StatusDot,
    RelativeTime,
    StatGrid,
    StatTile,
    Sparkline,
    ConfirmActionDialog,
    LogViewer,
    TerminalPane,
    apiFetch,
    createEventSource,
    createWebSocketUrl,
    useLocale,
    usePluginPath,
    PluginLink,
  }

  const rawModules: Record<HostModuleName, Record<string, unknown>> = {
    react: ReactNamespace as unknown as Record<string, unknown>,
    "react/jsx-runtime": ReactJsxRuntime as unknown as Record<string, unknown>,
    "react-dom": ReactDomNamespace as unknown as Record<string, unknown>,
    "react-router": ReactRouterNamespace as unknown as Record<string, unknown>,
    "react-router-dom": ReactRouterDomNamespace as unknown as Record<string, unknown>,
    "@reliaforge/plugin-sdk": sdkRuntimeExports,
  }

  const frozenModules = {} as Record<HostModuleName, Readonly<Record<string, unknown>>>
  for (const moduleName of Object.keys(HOST_MODULE_EXPORTS) as HostModuleName[]) {
    const descriptor = HOST_MODULE_EXPORTS[moduleName]
    frozenModules[moduleName] = pickModuleExports(
      rawModules[moduleName],
      descriptor.exports,
      descriptor.hasDefault,
    )
  }

  return Object.freeze({
    sdkVersion: SDK_VERSION,
    modules: Object.freeze(frozenModules),
  })
}

export function installHostBridge(): ReliaForgeHostBridge {
  const bridge = buildHostBridge()
  Object.defineProperty(window, "__RELIAFORGE_HOST__", {
    value: bridge,
    configurable: true,
    enumerable: true,
    writable: false,
  })
  return bridge
}
