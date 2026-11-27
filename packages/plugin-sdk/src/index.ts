import {
  createElement,
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react"
import type { LinkProps } from "react-router-dom"
import {
  HOST_MODULE_EXPORTS,
  SDK_VERSION,
  THEME_TOKEN_KEYS,
  type HostModuleDescriptor,
  type HostModuleName,
  type ThemeTokenKey,
} from "./host-exports.mjs"

export { HOST_MODULE_EXPORTS, SDK_VERSION, THEME_TOKEN_KEYS }
export type { HostModuleDescriptor, HostModuleName, ThemeTokenKey }

export type SdkLocale = "en" | "zh"

export interface SdkLocaleContextValue {
  locale: SdkLocale
  pathFor: (path: string) => string
  switchLocale: (locale: SdkLocale) => void
}

export interface PluginPageProps {
  pluginId: string
}

export interface PluginWidgetProps {
  pluginId: string
}

export interface PluginRouteDeclaration {
  path: string
  element: ComponentType<PluginPageProps>
}

export interface PluginOverviewWidget {
  id: string
  title: string
  titleZh?: string
  order?: number
  span?: 1 | 2
  component: ComponentType<PluginWidgetProps>
}

export interface ConsoleThemeDefinition {
  id: string
  label: string
  labelZh?: string
  cssClass: string
  tokens: Partial<Record<ThemeTokenKey, string>>
}

export interface ReliaForgeFrontendPlugin {
  apiVersion: "v1"
  id: string
  routes?: PluginRouteDeclaration[]
  overviewWidgets?: PluginOverviewWidget[]
  themes?: ConsoleThemeDefinition[]
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "default" | "small"
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "warning" | "danger"
}

export interface StatePanelProps {
  kind: "loading" | "empty" | "error"
  title: string
  description: string
  onRetry?: () => Promise<void>
  action?: ReactNode
  className?: string
}

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}

export interface DataTableColumn<T> {
  id: string
  header: ReactNode
  accessor?: (row: T) => string | number | boolean | null | undefined
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  numeric?: boolean
  align?: "left" | "right"
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  searchable?: boolean
  searchPlaceholder?: string
  filterFn?: (row: T, query: string) => boolean
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  initialSortColumnId?: string
  initialSortDirection?: "asc" | "desc"
  onRowClick?: (row: T) => void
  className?: string
  "data-testid"?: string
}

export type ActionRiskLevel = "safe" | "reversible" | "sensitive" | "destructive"

export interface ConfirmActionRequest {
  title: string
  description: string
  risk: ActionRiskLevel
  targetLabel: string
  targetValue: string
  confirmButtonLabel?: string
  cancelButtonLabel?: string
  warningBanner?: string
  argocdManagedWarning?: string
  requireTypedConfirmation?: boolean
  details?: Array<{ label: string; value: string }>
}

export interface ConfirmActionDialogProps {
  open: boolean
  request: ConfirmActionRequest | null
  pending?: boolean
  error?: string | null
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export interface LogLine {
  id?: string
  timestamp?: string
  level?: string
  source?: string
  message: string
}

export interface LogViewerProps {
  lines?: LogLine[]
  streamUrl?: string
  parseLine?: (rawEvent: MessageEvent<string>) => LogLine | LogLine[] | null
  maxLines?: number
  title?: string
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  defaultShowTimestamps?: boolean
  downloadFileName?: string
  className?: string
}

export type TerminalConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "exited"
  | "closed"
  | "error"

export interface TerminalConnectionOptions {
  wsUrl: string
  onStatusChange?: (status: TerminalConnectionStatus) => void
  onExit?: (code: number) => void
  onError?: (reason: string) => void
}

export interface TerminalPaneProps {
  connection: TerminalConnectionOptions | null
  title?: string
  className?: string
  minHeight?: number | string
}

export interface ApiFetchOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
}

export interface PluginLinkProps extends Omit<LinkProps, "to"> {
  to: string
  pluginId?: string
}

export interface ReliaForgeHostBridge {
  readonly sdkVersion: typeof SDK_VERSION
  readonly modules: {
    readonly [K in HostModuleName]: Readonly<Record<string, unknown>>
  }
}

declare global {
  interface Window {
    __RELIAFORGE_HOST__?: ReliaForgeHostBridge
  }
}

function readSdkModule(): Readonly<Record<string, unknown>> {
  const bridge = (globalThis as { __RELIAFORGE_HOST__?: ReliaForgeHostBridge }).__RELIAFORGE_HOST__
  const mod = bridge?.modules?.["@reliaforge/plugin-sdk"]
  if (!mod) {
    throw new Error("ReliaForge host SDK bridge is not initialized on window.__RELIAFORGE_HOST__.")
  }
  return mod
}

function readSdkExport<T>(name: string): T {
  const value = readSdkModule()[name]
  if (value === undefined) {
    throw new Error(`ReliaForge host SDK export "${name}" is unavailable.`)
  }
  return value as T
}

function createSdkComponent<P extends object>(name: string): ComponentType<P> {
  return function SdkHostComponent(props: P) {
    const Implementation = readSdkExport<ComponentType<P>>(name)
    return createElement(Implementation, props)
  }
}

export const Card = createSdkComponent<CardProps>("Card")
export const CardHeader = createSdkComponent<CardProps>("CardHeader")
export const CardContent = createSdkComponent<CardProps>("CardContent")

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function SdkButton(props, ref) {
  const Implementation = readSdkExport<
    ComponentType<ButtonProps & { ref?: Ref<HTMLButtonElement> }>
  >("Button")
  return createElement(Implementation, ref ? { ...props, ref } : props)
})

export const Badge = createSdkComponent<BadgeProps>("Badge")
export const StatePanel = createSdkComponent<StatePanelProps>("StatePanel")
export const PageHeader = createSdkComponent<PageHeaderProps>("PageHeader")

export function DataTable<T>(props: DataTableProps<T>) {
  const Implementation = readSdkExport<ComponentType<DataTableProps<T>>>("DataTable")
  return createElement(Implementation, props)
}

export const ConfirmActionDialog = createSdkComponent<ConfirmActionDialogProps>("ConfirmActionDialog")
export const LogViewer = createSdkComponent<LogViewerProps>("LogViewer")
export const TerminalPane = createSdkComponent<TerminalPaneProps>("TerminalPane")
export const PluginLink = createSdkComponent<PluginLinkProps>("PluginLink")

export function apiFetch<T = unknown>(path: string, options?: ApiFetchOptions): Promise<T> {
  return readSdkExport<<R = unknown>(path: string, options?: ApiFetchOptions) => Promise<R>>("apiFetch")<T>(
    path,
    options,
  )
}

export function createEventSource(path: string, init?: EventSourceInit): EventSource {
  return readSdkExport<(path: string, init?: EventSourceInit) => EventSource>("createEventSource")(
    path,
    init,
  )
}

export function createWebSocketUrl(path: string): string {
  return readSdkExport<(path: string) => string>("createWebSocketUrl")(path)
}

export function useLocale(): SdkLocaleContextValue {
  return readSdkExport<() => SdkLocaleContextValue>("useLocale")()
}

export function usePluginPath(pluginId?: string): (subPath?: string) => string {
  return readSdkExport<(pluginId?: string) => (subPath?: string) => string>("usePluginPath")(pluginId)
}
