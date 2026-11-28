import { ExternalLink, RefreshCw, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status } from "@/components/ops/Status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"

interface TopologyGuest {
  vmid: number
  kind: "QEMU" | "LXC"
  name: string
  cpu: number
  mem: number
  k8sNode?: { name: string; pods: string; cpu: number; mem: number }
}

const GUESTS: TopologyGuest[] = [
  { vmid: 101, kind: "QEMU", name: "ingress-gw-01", cpu: 8, mem: 50 },
  {
    vmid: 102,
    kind: "QEMU",
    name: "k8s-node-01",
    cpu: 24,
    mem: 50,
    k8sNode: { name: "k8s-node-01", pods: "12/12 Pods", cpu: 15, mem: 48 },
  },
  {
    vmid: 103,
    kind: "QEMU",
    name: "k8s-node-02",
    cpu: 19,
    mem: 42,
    k8sNode: { name: "k8s-node-02", pods: "12/16 Pods", cpu: 12, mem: 39 },
  },
  { vmid: 201, kind: "LXC", name: "artifact-cache", cpu: 6, mem: 25 },
  { vmid: 202, kind: "LXC", name: "log-relay", cpu: 5, mem: 25 },
]

interface ServiceEntry {
  id: string
  name: string
  category: "Core Services" | "Observability" | "Platform"
  detail: string
  actionLabel: string
  actionLabelZh: string
  href: string
}

const SERVICES: ServiceEntry[] = [
  { id: "payments", name: "Payments API", category: "Core Services", detail: "3/3 Ready", actionLabel: "Open", actionLabelZh: "打开", href: "https://reliaforge.dev/" },
  { id: "checkout", name: "Checkout Worker", category: "Core Services", detail: "2/2 Ready", actionLabel: "Metrics", actionLabelZh: "指标", href: "https://docs.reliaforge.dev/" },
  { id: "ledger", name: "Ledger Sync", category: "Core Services", detail: "2/2 Ready", actionLabel: "Traces", actionLabelZh: "链路", href: "https://docs.reliaforge.dev/" },
  { id: "ingress", name: "Ingress Gateway", category: "Platform", detail: "2/2 Ready", actionLabel: "Routes", actionLabelZh: "路由", href: "https://docs.reliaforge.dev/" },
  { id: "grafana", name: "Grafana", category: "Observability", detail: "1/1 Ready", actionLabel: "Dashboards", actionLabelZh: "看板", href: "https://docs.reliaforge.dev/" },
  { id: "cache", name: "Artifact Cache", category: "Platform", detail: "LXC 201 · running", actionLabel: "Registry", actionLabelZh: "仓库", href: "https://docs.reliaforge.dev/" },
]

const CATEGORIES = ["All", "Core Services", "Observability", "Platform"] as const

const TEXT = {
  en: {
    title: "Overview",
    allHealthy: "All healthy",
    snapshot: "Demo snapshot",
    refreshed: "Updated just now",
    refresh: "Refresh",
    pveMem: "PVE Memory",
    k8sPods: "K8s Pods",
    k8sValue: "24 running",
    k8sDetail: "2/2 nodes · 4 completed",
    gitops: "GitOps Sync",
    gitopsDetail: "8/8 healthy",
    alerts: "Active Alerts",
    alertsDetail: "1 silenced",
    topology: "Topology",
    ready: "Ready",
    catalog: "Service Catalog",
    searchPlaceholder: "Search services...",
    searchAria: "Search services",
    all: "All",
  },
  zh: {
    title: "总览",
    allHealthy: "全部健康",
    snapshot: "演示快照",
    refreshed: "刚刚刷新",
    refresh: "刷新",
    pveMem: "PVE 内存",
    k8sPods: "K8s Pod",
    k8sValue: "24 运行中",
    k8sDetail: "2/2 节点 · 4 已完成",
    gitops: "GitOps 同步",
    gitopsDetail: "8/8 健康",
    alerts: "活跃告警",
    alertsDetail: "1 条已静默",
    topology: "集群拓扑",
    ready: "就绪",
    catalog: "服务目录",
    searchPlaceholder: "搜索服务...",
    searchAria: "搜索服务",
    all: "全部",
  },
} as const

function MeterBar({ value }: { value: number }) {
  return (
    <span className="inline-block h-1.5 w-14 overflow-hidden rounded-full bg-neutral-soft align-middle">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
    </span>
  )
}

function TopologyCard({
  title,
  readyLabel,
  pathFor,
}: {
  title: string
  readyLabel: string
  pathFor: (path: string) => string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="text-xs text-muted tabular-nums">1</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-panel-inset px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-mono font-medium text-ink">
            <Link to={pathFor("/p/proxmox")} className="hover:text-accent hover:underline">
              pve-prod-01
            </Link>
            <Status value="online" />
          </div>
          <div className="flex items-center gap-3 text-muted tabular-nums">
            <span className="flex items-center gap-1.5">CPU <MeterBar value={18} /> 18%</span>
            <span className="flex items-center gap-1.5">Mem <MeterBar value={41} /> 41%</span>
          </div>
        </div>

        <div className="divide-y divide-line rounded-md border border-line">
          {GUESTS.map((guest) => (
            <div key={guest.vmid}>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-7 font-mono text-muted tabular-nums">{guest.vmid}</span>
                  <Badge>{guest.kind}</Badge>
                  <Link to={pathFor("/p/proxmox")} className="font-medium text-ink hover:text-accent hover:underline">
                    {guest.name}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-muted tabular-nums">
                  <span className="hidden items-center gap-1.5 sm:flex">CPU <MeterBar value={guest.cpu} /> {guest.cpu}%</span>
                  <span className="hidden items-center gap-1.5 sm:flex">Mem <MeterBar value={guest.mem} /> {guest.mem}%</span>
                  <Status value="running" />
                </div>
              </div>
              {guest.k8sNode ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 bg-panel-inset/60 py-1.5 pl-9 pr-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted">↳</span>
                    <Link to={pathFor("/p/kubernetes")} className="font-mono font-medium text-ink hover:text-accent hover:underline">
                      {guest.k8sNode.name}
                    </Link>
                    <span className="text-muted">· {guest.k8sNode.pods}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted tabular-nums">
                    <span className="hidden items-center gap-1.5 sm:flex">CPU <MeterBar value={guest.k8sNode.cpu} /> {guest.k8sNode.cpu}%</span>
                    <span className="hidden items-center gap-1.5 sm:flex">Mem <MeterBar value={guest.k8sNode.mem} /> {guest.k8sNode.mem}%</span>
                    <Status value="healthy" label={readyLabel} />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceCatalogCard({
  locale,
  copy,
}: {
  locale: "en" | "zh"
  copy: (typeof TEXT)["en"] | (typeof TEXT)["zh"]
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERVICES.filter((item) => {
      if (category !== "All" && item.category !== category) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    })
  }, [category, query])

  return (
    <Card>
      <CardHeader className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">{copy.catalog}</h2>
          <div className="flex items-center gap-1.5 rounded-md border border-line bg-panel-inset px-2 py-1">
            <Search className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchAria}
              className="w-32 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "border-accent/40 bg-accent-soft text-accent"
                  : "border-line bg-panel-inset text-muted hover:text-ink"
              }`}
            >
              {cat === "All" ? copy.all : cat}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-line p-0">
        {filteredServices.map((svc) => (
          <div key={svc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink">{svc.name}</span>
                <Badge>{svc.category}</Badge>
                <Status value="healthy" />
              </div>
              <p className="mt-0.5 text-xs text-muted">{svc.detail}</p>
            </div>
            <a
              href={svc.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-panel-inset px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-accent/50 hover:text-accent"
            >
              {locale === "zh" ? svc.actionLabelZh : svc.actionLabel}
              <ExternalLink className="h-3 w-3 text-muted" aria-hidden="true" />
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function DemoInfraOverviewWorkspace() {
  const { locale, pathFor } = useLocale()
  const copy = TEXT[locale]
  const [tick, setTick] = useState(0)

  return (
    <div className="space-y-4">
      <PageHeader
        title={copy.title}
        meta={
          <>
            <Status value="healthy" label={copy.allHealthy} />
            {tick > 0 ? <span>{copy.refreshed}</span> : null}
          </>
        }
        actions={
          <Button variant="secondary" size="small" onClick={() => setTick((n) => n + 1)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.refresh}
          </Button>
        }
      />

      <StatGrid>
        <StatTile label="PVE CPU" value="18%" detail="3/3 VM · 2/2 LXC" />
        <StatTile label={copy.pveMem} value="41%" detail="pve-prod-01" />
        <StatTile label={copy.k8sPods} value={copy.k8sValue} detail={copy.k8sDetail} />
        <StatTile label={copy.gitops} value="8 / 8" detail={copy.gitopsDetail} tone="success" />
        <StatTile label={copy.alerts} value="0" detail={copy.alertsDetail} />
      </StatGrid>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <TopologyCard title={copy.topology} readyLabel={copy.ready} pathFor={pathFor} />
        <ServiceCatalogCard locale={locale} copy={copy} />
      </div>
    </div>
  )
}
