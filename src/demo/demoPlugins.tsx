import type { ReliaForgeFrontendPlugin } from "@reliaforge/plugin-sdk"
import { DemoGitOpsWorkspace } from "@/demo/demoGitOps"
import { DemoKubernetesWorkspace } from "@/demo/demoKubernetes"
import { DemoAuditWorkspace, DemoObservabilityWorkspace } from "@/demo/demoObservability"
import { DemoInfraOverviewWorkspace } from "@/demo/demoOverview"
import { DemoProxmoxWorkspace } from "@/demo/demoProxmox"

export const DEMO_FRONTEND_PLUGINS: Record<string, ReliaForgeFrontendPlugin> = {
  infra_overview: {
    apiVersion: "v1",
    id: "infra_overview",
    routes: [{ path: "", element: DemoInfraOverviewWorkspace }],
  },
  proxmox: {
    apiVersion: "v1",
    id: "proxmox",
    routes: [{ path: "", element: DemoProxmoxWorkspace }],
  },
  kubernetes: {
    apiVersion: "v1",
    id: "kubernetes",
    routes: [{ path: "", element: DemoKubernetesWorkspace }],
  },
  gitops_argocd: {
    apiVersion: "v1",
    id: "gitops_argocd",
    routes: [{ path: "", element: DemoGitOpsWorkspace }],
  },
  observability: {
    apiVersion: "v1",
    id: "observability",
    routes: [{ path: "", element: DemoObservabilityWorkspace }],
  },
  ops_audit: {
    apiVersion: "v1",
    id: "ops_audit",
    routes: [{ path: "", element: DemoAuditWorkspace }],
  },
}
