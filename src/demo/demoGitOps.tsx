import { GitBranch, Layers } from "lucide-react"
import { useState } from "react"
import type { DataTableColumn } from "@reliaforge/plugin-sdk"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable } from "@/components/ops/DataTable"
import { Sheet } from "@/components/ops/Sheet"
import { Status } from "@/components/ops/Status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"

interface DemoArgoApp {
  name: string
  projectNs: string
  sync: string
  health: string
  revision: string
}

const APPS: DemoArgoApp[] = [
  { name: "cert-manager", projectNs: "production / platform", sync: "synced", health: "healthy", revision: "7d44e1a" },
  { name: "checkout-worker", projectNs: "production / checkout", sync: "synced", health: "healthy", revision: "6a21d9e" },
  { name: "external-dns", projectNs: "production / platform", sync: "synced", health: "healthy", revision: "1c98b3f" },
  { name: "grafana", projectNs: "production / monitoring", sync: "synced", health: "healthy", revision: "9e12a6c" },
  { name: "ingress-gateway", projectNs: "production / platform", sync: "synced", health: "healthy", revision: "4b7f0d2" },
  { name: "ledger-sync", projectNs: "production / payments", sync: "synced", health: "healthy", revision: "c3e91b4" },
  { name: "observability-stack", projectNs: "production / monitoring", sync: "synced", health: "healthy", revision: "2f80c5b" },
  { name: "payments-api", projectNs: "production / payments", sync: "synced", health: "healthy", revision: "8f4c2a1" },
]

const TEXT = {
  en: {
    app: "Application",
    projectNs: "Project / NS",
    sync: "Sync",
    health: "Health",
    resources: "Resources",
    tree: "Tree",
    treeTitle: "Resource Tree",
    summary: "8/8 synced · 8/8 healthy",
    readOnly: "Read-only",
    search: "Search applications, projects, namespaces...",
  },
  zh: {
    app: "应用",
    projectNs: "项目 / 命名空间",
    sync: "同步",
    health: "健康",
    resources: "资源树",
    tree: "查看资源",
    treeTitle: "资源树",
    summary: "8/8 已同步 · 8/8 健康",
    readOnly: "只读演示",
    search: "搜索应用、项目或命名空间...",
  },
} as const

function buildGitOpsColumns(
  copy: (typeof TEXT)["en"] | (typeof TEXT)["zh"],
  onSelect: (app: DemoArgoApp) => void,
): DataTableColumn<DemoArgoApp>[] {
  return [
    {
      id: "name",
      header: copy.app,
      accessor: (r) => r.name,
      cell: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <GitBranch className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
          {r.name}
        </span>
      ),
    },
    { id: "projectNs", header: copy.projectNs, accessor: (r) => r.projectNs, cell: (r) => <span className="font-mono text-xs text-muted">{r.projectNs}</span> },
    { id: "sync", header: copy.sync, accessor: (r) => r.sync, cell: (r) => <Status value={r.sync} /> },
    { id: "health", header: copy.health, accessor: (r) => r.health, cell: (r) => <Status value={r.health} /> },
    { id: "revision", header: "Revision", accessor: (r) => r.revision, cell: (r) => <Badge className="font-mono">{r.revision}</Badge> },
    {
      id: "actions",
      header: copy.resources,
      align: "right",
      cell: (r) => (
        <Button type="button" variant="secondary" size="small" onClick={() => onSelect(r)}>
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.tree}
        </Button>
      ),
    },
  ]
}

export function DemoGitOpsWorkspace() {
  const { locale } = useLocale()
  const copy = TEXT[locale]
  const [selectedApp, setSelectedApp] = useState<DemoArgoApp | null>(null)
  const columns = buildGitOpsColumns(copy, setSelectedApp)

  return (
    <div className="space-y-4">
      <PageHeader title="GitOps" meta={copy.summary} />

      <DataTable
        columns={columns}
        rows={APPS}
        rowKey={(r) => r.name}
        searchable
        searchPlaceholder={copy.search}
      />

      <Sheet
        open={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `${selectedApp.name} · ${copy.treeTitle}` : ""}
        meta={selectedApp ? `${selectedApp.projectNs} · rev ${selectedApp.revision}` : undefined}
        size="md"
      >
        {selectedApp ? (
          <div className="divide-y divide-line rounded-lg border border-line">
            {[
              { kind: "Deployment", name: selectedApp.name },
              { kind: "Service", name: selectedApp.name },
              { kind: "ConfigMap", name: `${selectedApp.name}-config` },
              { kind: "HTTPRoute", name: `${selectedApp.name}-route` },
            ].map((res) => (
              <div key={res.kind} className="flex items-center justify-between px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <Badge>{res.kind}</Badge>
                  <span className="font-mono text-ink">{res.name}</span>
                </div>
                <Status value="synced" />
              </div>
            ))}
          </div>
        ) : null}
      </Sheet>
    </div>
  )
}
