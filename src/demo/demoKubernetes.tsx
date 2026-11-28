import { ScrollText } from "lucide-react"
import { useEffect, useState } from "react"
import type { DataTableColumn, LogLine } from "@reliaforge/plugin-sdk"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable } from "@/components/ops/DataTable"
import { LogViewer } from "@/components/ops/LogViewer"
import { Sheet } from "@/components/ops/Sheet"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status } from "@/components/ops/Status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"

interface DemoWorkload {
  id: string
  kind: string
  namespace: string
  name: string
  ready: string
  status: string
  gitops: string
  image: string
  pod: string
}

const WORKLOADS: DemoWorkload[] = [
  { id: "argocd", kind: "Deployment", namespace: "argocd", name: "argocd-server", ready: "2/2", status: "healthy", gitops: "argocd-server", image: "quay.io/argoproj/argocd:v2.13.2", pod: "argocd-server-6b94c-7d2a" },
  { id: "checkout", kind: "Deployment", namespace: "checkout", name: "checkout-worker", ready: "2/2", status: "healthy", gitops: "checkout-worker", image: "registry.example.com/checkout-worker:1.14.0", pod: "checkout-worker-6d81a-9q2w" },
  { id: "grafana", kind: "Deployment", namespace: "monitoring", name: "grafana", ready: "1/1", status: "healthy", gitops: "grafana", image: "grafana/grafana:11.4.0", pod: "grafana-55c1d-k8n3" },
  { id: "ledger", kind: "Deployment", namespace: "payments", name: "ledger-sync", ready: "2/2", status: "healthy", gitops: "ledger-sync", image: "registry.example.com/ledger-sync:1.9.4", pod: "ledger-sync-5c22e-7b1z" },
  { id: "payments", kind: "Deployment", namespace: "payments", name: "payments-api", ready: "3/3", status: "healthy", gitops: "payments-api", image: "registry.example.com/payments-api:2.8.1", pod: "payments-api-7f9b4c-x2k9" },
  { id: "ingress", kind: "Deployment", namespace: "platform", name: "ingress-gateway", ready: "2/2", status: "healthy", gitops: "ingress-gateway", image: "envoyproxy/envoy:v1.32.0", pod: "ingress-gateway-88fa1-2v4r" },
]

const NODES = [
  { name: "k8s-node-01", cpu: "1.9/12c (15%)", cpuPct: 15, mem: "11.5 GiB/24.0 GiB (48%)", memPct: 48 },
  { name: "k8s-node-02", cpu: "1.4/12c (12%)", cpuPct: 12, mem: "9.4 GiB/24.0 GiB (39%)", memPct: 39 },
]

const SAMPLE_EVENTS = [
  "POST /v1/charges status=200 latency_ms=11.4 pool=6/32",
  "GET /readyz status=200 active_conns=18",
  "ledger.checkpoint lag_ms=4 committed_offset=1849201",
  "POST /v1/refunds status=200 latency_ms=8.2 trace=9f42a0",
  "metrics.flush exported=42 series duration_ms=3.1",
]

const TEXT = {
  en: {
    kind: "Kind",
    namespace: "Namespace",
    name: "Name",
    ready: "Ready",
    status: "Status",
    image: "Image",
    actions: "Actions",
    logs: "Logs",
    liveLogs: "Live Pod Logs",
    namespaces: "Namespaces",
    podsRunning: "Pods Running",
    podsValue: "24 running",
    podsDetail: "4 completed",
    warnings: "Warning Events",
    search: "Search workloads, images...",
    filterNs: "Filter namespace",
    allNs: "All namespaces",
  },
  zh: {
    kind: "类型",
    namespace: "命名空间",
    name: "名称",
    ready: "就绪",
    status: "状态",
    image: "镜像",
    actions: "操作",
    logs: "实时日志",
    liveLogs: "Pod 实时日志",
    namespaces: "命名空间",
    podsRunning: "运行中 Pod",
    podsValue: "24 运行中",
    podsDetail: "4 已完成",
    warnings: "警告事件",
    search: "搜索工作负载或镜像...",
    filterNs: "筛选命名空间",
    allNs: "全部命名空间",
  },
} as const

function StreamingDemoLogs({ workload }: { workload: DemoWorkload }) {
  const [lines, setLines] = useState<LogLine[]>(() => [
    { id: "0", timestamp: new Date(Date.now() - 8000).toISOString(), level: "INFO", source: workload.pod, message: `listening=0.0.0.0:8080 image=${workload.image}` },
    { id: "1", timestamp: new Date(Date.now() - 5000).toISOString(), level: "INFO", source: workload.pod, message: SAMPLE_EVENTS[0] },
    { id: "2", timestamp: new Date(Date.now() - 2000).toISOString(), level: "INFO", source: workload.pod, message: SAMPLE_EVENTS[1] },
  ])

  useEffect(() => {
    let seq = 3
    const timer = window.setInterval(() => {
      const msg = SAMPLE_EVENTS[seq % SAMPLE_EVENTS.length]
      setLines((prev) => [
        ...prev.slice(-80),
        { id: String(seq), timestamp: new Date().toISOString(), level: "INFO", source: workload.pod, message: msg },
      ])
      seq += 1
    }, 2200)
    return () => window.clearInterval(timer)
  }, [workload.pod])

  return (
    <LogViewer
      title={`${workload.namespace}/${workload.pod}`}
      lines={lines}
      downloadFileName={`${workload.pod}.log`}
    />
  )
}

function buildWorkloadColumns(
  copy: (typeof TEXT)["en"] | (typeof TEXT)["zh"],
  onOpenLogs: (workload: DemoWorkload) => void,
): DataTableColumn<DemoWorkload>[] {
  return [
    { id: "kind", header: copy.kind, accessor: (r) => r.kind, cell: (r) => <Badge>{r.kind}</Badge> },
    { id: "namespace", header: copy.namespace, accessor: (r) => r.namespace, cell: (r) => <span className="font-mono text-xs text-muted">{r.namespace}</span> },
    { id: "name", header: copy.name, accessor: (r) => r.name, cell: (r) => <span className="font-semibold text-ink">{r.name}</span> },
    { id: "ready", header: copy.ready, accessor: (r) => r.ready, numeric: true, cell: (r) => <span className="font-mono text-xs">{r.ready}</span> },
    { id: "status", header: copy.status, accessor: (r) => r.status, cell: (r) => <Status value={r.status} /> },
    { id: "image", header: copy.image, accessor: (r) => r.image, truncate: true, hideBelow: "lg", cell: (r) => <span className="font-mono text-xs text-muted">{r.image}</span> },
    {
      id: "actions",
      header: copy.actions,
      align: "right",
      nowrap: true,
      cell: (r) => (
        <Button type="button" variant="secondary" size="small" onClick={() => onOpenLogs(r)}>
          <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.logs}
        </Button>
      ),
    },
  ]
}

function ClusterNodeGrid({ readyLabel }: { readyLabel: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {NODES.map((node) => (
        <Card key={node.name}>
          <CardContent className="space-y-2 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-muted">{node.name}</div>
                <div className="text-base font-semibold text-ink">v1.32.2</div>
              </div>
              <Status value="healthy" label={readyLabel} />
            </div>
            <div className="space-y-1 text-xs text-muted tabular-nums">
              <div className="flex items-center justify-between">
                <span>CPU</span>
                <span>{node.cpu}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-soft">
                <div className="h-full rounded-full bg-accent" style={{ width: `${node.cpuPct}%` }} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span>Mem</span>
                <span>{node.mem}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-soft">
                <div className="h-full rounded-full bg-accent" style={{ width: `${node.memPct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DemoKubernetesWorkspace() {
  const { locale } = useLocale()
  const copy = TEXT[locale]
  const [ns, setNs] = useState("all")
  const [logTarget, setLogTarget] = useState<DemoWorkload | null>(null)

  const filtered = ns === "all" ? WORKLOADS : WORKLOADS.filter((w) => w.namespace === ns)
  const columns = buildWorkloadColumns(copy, setLogTarget)

  return (
    <div className="space-y-4">
      <PageHeader title="Kubernetes" meta="prod-us-east · v1.32.2 · 2/2 nodes" />

      <StatGrid>
        <StatTile label={copy.namespaces} value="5" />
        <StatTile label={copy.podsRunning} value={copy.podsValue} detail={copy.podsDetail} />
        <StatTile label="Deployments" value="6" />
        <StatTile label={copy.warnings} value="0" />
      </StatGrid>

      <ClusterNodeGrid readyLabel={copy.ready} />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        searchable
        searchPlaceholder={copy.search}
        toolbar={
          <select
            value={ns}
            onChange={(e) => setNs(e.target.value)}
            aria-label={copy.filterNs}
            className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">{copy.allNs}</option>
            {["payments", "checkout", "platform", "monitoring", "argocd"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        }
      />

      <Sheet
        open={logTarget !== null}
        onClose={() => setLogTarget(null)}
        title={logTarget ? `${logTarget.name} · ${copy.liveLogs}` : ""}
        meta={logTarget ? `${logTarget.namespace} / ${logTarget.pod}` : undefined}
        size="xl"
      >
        {logTarget ? <StreamingDemoLogs workload={logTarget} /> : null}
      </Sheet>
    </div>
  )
}
