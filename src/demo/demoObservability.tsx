import { useState } from "react"
import type { DataTableColumn, LogLine } from "@reliaforge/plugin-sdk"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable } from "@/components/ops/DataTable"
import { LogViewer } from "@/components/ops/LogViewer"
import { Sparkline } from "@/components/ops/Sparkline"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status } from "@/components/ops/Status"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"

const LOKI_LINES: LogLine[] = [
  { id: "1", timestamp: "2026-11-28T07:14:06Z", level: "INFO", source: "payments-api-7f9b4c-x2k9", message: "ledger.sync batch=4821 committed=true duration_ms=9.4" },
  { id: "2", timestamp: "2026-11-28T07:14:05Z", level: "INFO", source: "ingress-gateway-88fa1-2v4r", message: "upstream=payments-api tls=1.3 status=200" },
  { id: "3", timestamp: "2026-11-28T07:14:03Z", level: "INFO", source: "payments-api-7f9b4c-x2k9", message: "POST /v1/charges status=200 duration_ms=11.4" },
  { id: "4", timestamp: "2026-11-28T07:13:58Z", level: "WARN", source: "checkout-worker-6d81a-9q2w", message: "retry queue depth=4 backoff_ms=250" },
  { id: "5", timestamp: "2026-11-28T07:13:51Z", level: "INFO", source: "grafana-55c1d-k8n3", message: "dashboard.query uid=cluster-overview ms=18" },
]

const OBS_TEXT = {
  en: {
    title: "Observability",
    logs: "Logs",
    metrics: "Metrics",
    alerts: "Alerts",
    cpu: "Cluster CPU",
    memory: "Cluster Memory",
    silenced: "Silenced",
    silenceMeta: "1h 40m left · created by oncall@example.com",
    noActiveAlerts: "No active unsilenced alerts right now.",
  },
  zh: {
    title: "可观测性",
    logs: "日志查询",
    metrics: "指标趋势",
    alerts: "告警与静默",
    cpu: "集群 CPU",
    memory: "集群内存",
    silenced: "已静默",
    silenceMeta: "剩余 1h 40m · 创建人 oncall@example.com",
    noActiveAlerts: "当前无未静默的活跃告警。",
  },
} as const

type ObsTab = "logs" | "metrics" | "alerts"

function ObservabilityTabBody({ tab, copy }: { tab: ObsTab; copy: (typeof OBS_TEXT)["en"] | (typeof OBS_TEXT)["zh"] }) {
  if (tab === "logs") {
    return <LogViewer title='Loki · {namespace!=""}' lines={LOKI_LINES} downloadFileName="loki-demo.log" />
  }
  if (tab === "metrics") {
    return (
      <StatGrid>
        <StatTile label={copy.cpu} value="18.4%" chart={<Sparkline values={[15, 17, 16, 19, 18, 20, 18]} color="accent" />} />
        <StatTile label={copy.memory} value="44.8%" chart={<Sparkline values={[42, 43, 44, 44, 45, 45, 45]} color="accent" />} />
        <StatTile label="P95 Latency" value="14.2 ms" chart={<Sparkline values={[12, 14, 15, 13, 14, 15, 14]} color="info" />} />
        <StatTile label="Error Rate" value="0.02%" tone="success" chart={<Sparkline values={[0.02, 0.01, 0.03, 0.02, 0.02, 0.01, 0.02]} color="success" />} />
      </StatGrid>
    )
  }
  return (
    <Card>
      <CardContent className="space-y-2 py-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{copy.silenced}</Badge>
            <span className="font-semibold text-ink">NodeDiskMaintenance</span>
          </div>
          <span className="text-muted">{copy.silenceMeta}</span>
        </div>
        <p className="text-muted">{copy.noActiveAlerts}</p>
      </CardContent>
    </Card>
  )
}

export function DemoObservabilityWorkspace() {
  const { locale } = useLocale()
  const copy = OBS_TEXT[locale]
  const [tab, setTab] = useState<ObsTab>("logs")

  const tabs: Array<[ObsTab, string]> = [
    ["logs", copy.logs],
    ["metrics", copy.metrics],
    ["alerts", copy.alerts],
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title={copy.title}
        meta={
          <span className="inline-flex items-center gap-3">
            <Status value="healthy" label="Prometheus" />
            <Status value="healthy" label="Loki" />
            <Status value="healthy" label="Alertmanager" />
          </span>
        }
      />

      <div className="flex gap-2 border-b border-line pb-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === id ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ObservabilityTabBody tab={tab} copy={copy} />
    </div>
  )
}

interface DemoAuditRow {
  id: string
  time: string
  actor: string
  plugin: string
  action: string
  target: string
  outcome: string
}

const AUDIT_ROWS: DemoAuditRow[] = [
  { id: "4821", time: "2m ago", actor: "oncall@example.com", plugin: "kubernetes", action: "k8s.rollout_restart", target: "payments/payments-api", outcome: "succeeded" },
  { id: "4820", time: "18m ago", actor: "oncall@example.com", plugin: "proxmox", action: "proxmox.lxc_terminal", target: "pve-prod-01/lxc/201", outcome: "succeeded" },
  { id: "4819", time: "45m ago", actor: "sre-bot@example.com", plugin: "gitops_argocd", action: "argocd.sync", target: "payments-api@8f4c2a1", outcome: "succeeded" },
  { id: "4818", time: "1h ago", actor: "oncall@example.com", plugin: "observability", action: "observability.silence_create", target: "NodeDiskMaintenance (2h)", outcome: "succeeded" },
  { id: "4817", time: "3h ago", actor: "admin@example.com", plugin: "proxmox", action: "proxmox.power_stop", target: "pve-prod-01/qemu/999", outcome: "denied" },
]

const AUDIT_TEXT = {
  en: {
    title: "Operations Audit",
    meta: "Append-only SQLite audit log (demo data)",
    time: "Time",
    actor: "Actor",
    plugin: "Plugin",
    action: "Action",
    target: "Target",
    outcome: "Outcome",
    search: "Search actor, action, or target...",
  },
  zh: {
    title: "运维审计",
    meta: "本地 SQLite 只追加日志（演示数据）",
    time: "时间",
    actor: "操作人",
    plugin: "插件",
    action: "动作",
    target: "目标资源",
    outcome: "结果",
    search: "搜索操作人、动作或目标...",
  },
} as const

export function DemoAuditWorkspace() {
  const { locale } = useLocale()
  const copy = AUDIT_TEXT[locale]

  const columns: DataTableColumn<DemoAuditRow>[] = [
    { id: "time", header: copy.time, accessor: (r) => r.time, nowrap: true, cell: (r) => <span className="font-mono text-xs text-muted">{r.time}</span> },
    { id: "actor", header: copy.actor, accessor: (r) => r.actor, cell: (r) => <span className="font-mono text-xs text-ink">{r.actor}</span> },
    { id: "plugin", header: copy.plugin, accessor: (r) => r.plugin, cell: (r) => <Badge>{r.plugin}</Badge> },
    { id: "action", header: copy.action, accessor: (r) => r.action, cell: (r) => <span className="font-mono text-xs font-medium text-ink">{r.action}</span> },
    { id: "target", header: copy.target, accessor: (r) => r.target, cell: (r) => <span className="font-mono text-xs text-muted">{r.target}</span> },
    { id: "outcome", header: copy.outcome, accessor: (r) => r.outcome, cell: (r) => <Status value={r.outcome} /> },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title={copy.title} />
      <DataTable
        columns={columns}
        rows={AUDIT_ROWS}
        rowKey={(r) => r.id}
        searchable
        searchPlaceholder={copy.search}
      />
    </div>
  )
}
