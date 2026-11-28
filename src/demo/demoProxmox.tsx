import { Terminal } from "lucide-react"
import { useState, type FormEvent } from "react"
import type { DataTableColumn } from "@reliaforge/plugin-sdk"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTable } from "@/components/ops/DataTable"
import { Sheet } from "@/components/ops/Sheet"
import { Sparkline } from "@/components/ops/Sparkline"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status } from "@/components/ops/Status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/i18n/useLocale"

interface DemoGuest {
  vmid: number
  kind: "QEMU" | "LXC"
  name: string
  tags: string[]
  status: string
  cpu: string
  memory: string
  disk: string
  uptime: string
}

const GUESTS: DemoGuest[] = [
  { vmid: 101, kind: "QEMU", name: "ingress-gw-01", tags: ["edge", "gateway"], status: "running", cpu: "8.0% · 4c", memory: "2.00 GiB / 4.00 GiB", disk: "13.0 GiB / 64.0 GiB", uptime: "45d 0h" },
  { vmid: 102, kind: "QEMU", name: "k8s-node-01", tags: ["k8s", "control-plane"], status: "running", cpu: "24.0% · 12c", memory: "12.0 GiB / 24.0 GiB", disk: "89.4 GiB / 320.0 GiB", uptime: "45d 0h" },
  { vmid: 103, kind: "QEMU", name: "k8s-node-02", tags: ["k8s", "worker"], status: "running", cpu: "19.0% · 12c", memory: "10.0 GiB / 24.0 GiB", disk: "76.4 GiB / 320.0 GiB", uptime: "45d 0h" },
  { vmid: 201, kind: "LXC", name: "artifact-cache", tags: ["ci", "cache"], status: "running", cpu: "6.0% · 2c", memory: "1.00 GiB / 4.00 GiB", disk: "16.8 GiB / 59.6 GiB", uptime: "30d 0h" },
  { vmid: 202, kind: "LXC", name: "log-relay", tags: ["telemetry"], status: "running", cpu: "5.0% · 2c", memory: "512.0 MiB / 2.00 GiB", disk: "3.73 GiB / 29.8 GiB", uptime: "30d 0h" },
]

const STORAGE_POOLS = [
  { name: "ceph-backups", type: "rbd", used: "1.29 TiB / 3.64 TiB (36%)", free: "Free 2.35 TiB", pct: 36 },
  { name: "nvme-vmstore", type: "lvmthin", used: "197.4 GiB / 894.1 GiB (22%)", free: "Free 696.6 GiB", pct: 22 },
]

const SERIES_BY_RANGE = {
  "1h": { cpu: [14, 16, 15, 19, 17, 18, 20, 18, 17, 18], mem: [38, 39, 39, 40, 40, 41, 41, 41, 41, 41], netIn: [48, 52, 60, 58, 66, 69, 71, 73, 72, 73], netOut: [28, 31, 34, 36, 39, 41, 42, 44, 43, 44] },
  "24h": { cpu: [11, 13, 21, 27, 22, 16, 15, 19, 20, 18], mem: [36, 37, 38, 40, 41, 40, 40, 41, 41, 41], netIn: [32, 41, 78, 84, 65, 51, 59, 72, 74, 73], netOut: [20, 26, 48, 52, 44, 34, 38, 45, 44, 44] },
  "7d": { cpu: [15, 18, 24, 19, 16, 22, 18, 17, 20, 18], mem: [34, 35, 36, 38, 39, 39, 40, 40, 41, 41], netIn: [45, 55, 72, 61, 53, 68, 70, 64, 71, 73], netOut: [29, 35, 46, 39, 35, 42, 44, 41, 43, 44] },
} as const

const TEXT = {
  en: {
    name: "Name",
    status: "Status",
    memory: "Memory",
    disk: "Disk",
    uptime: "Uptime",
    actions: "Actions",
    shell: "Shell",
    readOnly: "Read-only",
    netIn: "Net In",
    netOut: "Net Out",
    active: "Active",
    search: "Search VMID, name, tags...",
    all: "All",
    shellMeta: "Simulated interactive LXC shell (browser-only demo)",
  },
  zh: {
    name: "名称",
    status: "状态",
    memory: "内存",
    disk: "磁盘",
    uptime: "运行时长",
    actions: "操作",
    shell: "终端",
    readOnly: "只读演示",
    netIn: "网络入站",
    netOut: "网络出站",
    active: "活跃",
    search: "搜索 VMID、名称、标签...",
    all: "全部",
    shellMeta: "模拟交互式网页终端（仅浏览器本地仿真）",
  },
} as const

function runMockCommand(cmd: string, guestName: string): string[] {
  const cleaned = cmd.trim()
  if (!cleaned) return []
  const commands: Record<string, string[]> = {
    help: ["Simulated LXC shell commands: uptime, df -h, free -h, ps, ls, uname -a, clear"],
    uptime: [" 07:42:18 up 30 days,  0:14,  1 user,  load average: 0.14, 0.18, 0.16"],
    "df -h": [
      "Filesystem      Size  Used Avail Use% Mounted on",
      "/dev/loop0       60G   17G   41G  29% /",
      "tmpfs           2.0G   12M  2.0G   1% /run",
    ],
    "free -h": [
      "               total        used        free      shared  buff/cache   available",
      "Mem:           4.0Gi       1.0Gi       2.4Gi        16Mi       612Mi       2.9Gi",
    ],
    ps: [
      "  PID TTY          TIME CMD",
      "    1 ?        00:04:12 systemd",
      `  142 ?        00:18:45 ${guestName}d --listen=:5000`,
      "  884 pts/0    00:00:00 bash",
    ],
    ls: ["cache.db  config.yaml  healthcheck.sh  logs/"],
    "uname -a": [`Linux ${guestName} 6.8.12-pve #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`],
  }
  return (
    commands[cleaned] ?? [
      `bash: ${cleaned.split(" ")[0]}: demo shell supports: help, uptime, df -h, free -h, ps, ls, uname -a, clear`,
    ]
  )
}

function MockLxcTerminal({ guest }: { guest: DemoGuest }) {
  const [history, setHistory] = useState<string[]>([
    `Connected to pve-prod-01 / LXC ${guest.vmid} (${guest.name}) via simulated termproxy.`,
    "Type 'help', 'uptime', 'df -h', 'free -h', 'ps', or 'clear'.",
    "",
  ])
  const [input, setInput] = useState("")

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cmd = input.trim()
    setInput("")
    if (cmd === "clear") {
      setHistory([])
      return
    }
    const output = runMockCommand(cmd, guest.name)
    setHistory((prev) => [...prev, `root@${guest.name}:~# ${cmd}`, ...output])
  }

  return (
    <div className="flex h-[28rem] flex-col overflow-hidden rounded-lg border border-line bg-[#0b0d12] font-mono text-xs text-[#d6e0f0]">
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap p-4 leading-6">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith("root@") ? "text-[#34d399]" : undefined}>
            {line || "\u00A0"}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/10 bg-[#080a0e] px-4 py-2.5">
        <span className="shrink-0 text-[#34d399]">root@{guest.name}:~#</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="uptime"
          aria-label="Mock terminal command"
          className="w-full bg-transparent text-xs text-white placeholder:text-white/35 focus:outline-none"
        />
      </form>
    </div>
  )
}

function buildProxmoxColumns(
  copy: (typeof TEXT)["en"] | (typeof TEXT)["zh"],
  onOpenShell: (guest: DemoGuest) => void,
): DataTableColumn<DemoGuest>[] {
  return [
    {
      id: "vmid",
      header: "ID",
      accessor: (r) => r.vmid,
      numeric: true,
      nowrap: true,
      cell: (r) => (
        <span className="inline-flex items-center gap-2 font-mono">
          <Badge>{r.kind}</Badge>
          <span>{r.vmid}</span>
        </span>
      ),
    },
    {
      id: "name",
      header: copy.name,
      accessor: (r) => r.name,
      cell: (r) => (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-ink">{r.name}</span>
          {r.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </span>
      ),
    },
    { id: "status", header: copy.status, accessor: (r) => r.status, cell: (r) => <Status value={r.status} /> },
    { id: "cpu", header: "CPU", accessor: (r) => r.cpu, numeric: true, nowrap: true, cell: (r) => <span className="font-mono text-xs">{r.cpu}</span> },
    { id: "memory", header: copy.memory, accessor: (r) => r.memory, numeric: true, nowrap: true, hideBelow: "md", cell: (r) => <span className="font-mono text-xs">{r.memory}</span> },
    { id: "disk", header: copy.disk, accessor: (r) => r.disk, numeric: true, nowrap: true, hideBelow: "lg", cell: (r) => <span className="font-mono text-xs">{r.disk}</span> },
    { id: "uptime", header: copy.uptime, accessor: (r) => r.uptime, numeric: true, nowrap: true, hideBelow: "xl", cell: (r) => <span className="font-mono text-xs text-muted">{r.uptime}</span> },
    {
      id: "actions",
      header: copy.actions,
      align: "right",
      nowrap: true,
      cell: (r) =>
        r.kind === "LXC" ? (
          <Button type="button" variant="secondary" size="small" onClick={() => onOpenShell(r)}>
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.shell}
          </Button>
        ) : (
          <span className="text-xs text-muted">{copy.readOnly}</span>
        ),
    },
  ]
}

function StoragePoolGrid({ activeLabel }: { activeLabel: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {STORAGE_POOLS.map((pool) => (
        <Card key={pool.name}>
          <CardContent className="space-y-2 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                {pool.name} <span className="font-normal text-muted">{pool.type}</span>
              </span>
              <Status value="healthy" label={activeLabel} />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-soft">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pool.pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted tabular-nums">
              <span>{pool.used}</span>
              <span>{pool.free}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DemoProxmoxWorkspace() {
  const { locale } = useLocale()
  const copy = TEXT[locale]
  const [range, setRange] = useState<"1h" | "24h" | "7d">("1h")
  const [kindFilter, setKindFilter] = useState<"ALL" | "QEMU" | "LXC">("ALL")
  const [terminalGuest, setTerminalGuest] = useState<DemoGuest | null>(null)

  const series = SERIES_BY_RANGE[range]
  const rows = kindFilter === "ALL" ? GUESTS : GUESTS.filter((g) => g.kind === kindFilter)
  const columns = buildProxmoxColumns(copy, setTerminalGuest)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Proxmox"
        meta={
          <>
            <span className="font-mono text-ink">pve-prod-01</span>
            <Status value="online" />
            <span>PVE 9.1.1 · Up 45d 0h · 3/3 VM · 2/2 LXC</span>
          </>
        }
        actions={
          <div className="inline-flex rounded-md border border-line bg-panel-inset p-0.5">
            {(["1h", "24h", "7d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${range === r ? "bg-panel text-accent" : "text-muted hover:text-ink"}`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <StatGrid>
        <StatTile label="CPU %" value="18.0%" meta="32 cores" chart={<Sparkline values={[...series.cpu]} color="accent" />} />
        <StatTile label={copy.memory} value="26.4 GiB" meta="/ 64.0 GiB (41%)" chart={<Sparkline values={[...series.mem]} color="accent" />} />
        <StatTile label={copy.netIn} value="73.2 KB/s" chart={<Sparkline values={[...series.netIn]} color="info" />} />
        <StatTile label={copy.netOut} value="44.2 KB/s" chart={<Sparkline values={[...series.netOut]} color="accent" />} />
      </StatGrid>

      <StoragePoolGrid activeLabel={copy.active} />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => String(r.vmid)}
        searchable
        searchPlaceholder={copy.search}
        toolbar={
          <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
            {(["ALL", "QEMU", "LXC"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`rounded px-2 py-0.5 text-xs font-medium ${kindFilter === k ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
              >
                {k === "ALL" ? copy.all : k}
              </button>
            ))}
          </div>
        }
      />

      <Sheet
        open={terminalGuest !== null}
        onClose={() => setTerminalGuest(null)}
        title={terminalGuest ? `LXC ${terminalGuest.vmid} · ${terminalGuest.name}` : ""}
        meta={copy.shellMeta}
        size="lg"
      >
        {terminalGuest ? <MockLxcTerminal guest={terminalGuest} /> : null}
      </Sheet>
    </div>
  )
}
