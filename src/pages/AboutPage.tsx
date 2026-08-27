import { BookOpen, Code2, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent } from "@/components/ui/card"

const principles = [
  { title: "Manifest first", body: "The backend manifest owns identity, dependencies, capabilities, and category; Python Settings classes define configuration.", icon: BookOpen },
  { title: "Lifecycle managed", body: "Discovery, validation, initialization, start, health, and stop are explicit and testable states.", icon: Code2 },
  { title: "Safe by default", body: "Plugins begin without external side effects, secrets stay server-side, and production management access fails closed.", icon: ShieldCheck },
] as const

export function AboutPage() {
  return (
    <div className="space-y-9">
      <PageHeader eyebrow="Open source · MIT" title="About ReliaForge" description="A lightweight Python and React foundation for building focused operations plugins with visible contracts and predictable lifecycle behavior." />
      <section className="grid gap-5 md:grid-cols-3">
        {principles.map(({ title, body, icon: Icon }) => (
          <Card key={title}>
            <CardContent>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h2 className="mt-5 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold">Where to start</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>Start the backend and verify its liveness and readiness probes.</li>
            <li>Open demo and runbook to inspect a typed cross-plugin capability.</li>
            <li>Copy the backend plugin template, change its identifier, and restart discovery.</li>
          </ol>
          <p className="mt-5 text-sm text-muted">Copyright © 2026 Sajo Luo.</p>
        </CardContent>
      </Card>
    </div>
  )
}
