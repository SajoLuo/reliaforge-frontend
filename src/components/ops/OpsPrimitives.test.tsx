import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { RelativeTime } from "@/components/ops/RelativeTime"
import { formatRelativeTime } from "@/components/ops/relativeTimeFormat"
import { Sparkline } from "@/components/ops/Sparkline"
import { StatGrid, StatTile } from "@/components/ops/StatGrid"
import { Status, StatusBadge, StatusDot } from "@/components/ops/Status"
import { LocaleProvider } from "@/i18n/LocaleProvider"

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe("Status, RelativeTime, StatGrid, and Sparkline", () => {
  it("renders localized Status dot vs 4px badge semantics", () => {
    render(
      <MemoryRouter initialEntries={["/?lang=zh"]}>
        <LocaleProvider>
          <Status value="healthy" />
          <Status value="OutOfSync" />
          <Status value="firing" />
          <StatusDot value="degraded" />
          <StatusBadge value="Synced" />
        </LocaleProvider>
      </MemoryRouter>,
    )

    const healthyEl = screen.getByText("健康").parentElement!
    expect(healthyEl.tagName).toBe("SPAN")
    expect(healthyEl).not.toHaveClass("rounded")

    const outOfSyncEl = screen.getByText("未同步").parentElement!
    expect(outOfSyncEl).toHaveClass("rounded", "bg-warning-soft", "text-warning-ink")

    const firingEl = screen.getByText("告警中").parentElement!
    expect(firingEl).toHaveClass("rounded", "bg-danger-soft", "text-danger-ink")

    expect(screen.getByText("降级").parentElement).not.toHaveClass("bg-warning-soft")
    expect(screen.getByText("已同步").parentElement).toHaveClass("rounded", "bg-success-soft")
  })

  it("formats relative timestamps in zh/en and exposes absolute local tooltip", () => {
    const base = new Date("2026-11-28T02:14:00Z").getTime()
    expect(formatRelativeTime(new Date(base - 12_000), base, "zh")).toBe("12 秒前")
    expect(formatRelativeTime(new Date(base - 180_000), base, "zh")).toBe("3 分钟前")
    expect(formatRelativeTime(new Date(base - 7_200_000), base, "zh")).toBe("2 小时前")
    expect(formatRelativeTime(new Date(base - 180_000), base, "en")).toBe("3m ago")

    const oldDate = new Date(base - 48 * 3600 * 1000)
    expect(formatRelativeTime(oldDate, base, "zh")).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/)

    render(
      <div>
        <RelativeTime value={null} />
        <RelativeTime value={new Date(Date.now() - 5000).toISOString()} />
      </div>,
    )
    expect(screen.getByText("—")).toBeInTheDocument()
    const timeEl = document.querySelector("time")!
    expect(timeEl).toHaveAttribute("title")
  })

  it("renders StatGrid/StatTile and Sparkline edge cases cleanly", () => {
    const { container } = render(
      <StatGrid>
        <StatTile label="CPU" value="24%" detail="4 cores" chart={<Sparkline values={[10, 20, 30]} color="accent" label="CPU trend" />} />
        <StatTile label="Empty" value="0" chart={<Sparkline values={[]} />} />
        <StatTile label="Single" value="1" chart={<Sparkline values={[5]} color="warning" fill={false} />} />
      </StatGrid>,
    )

    expect(screen.getByText("24%")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "CPU trend" })).toBeInTheDocument()
    expect(container.querySelectorAll("polyline")).toHaveLength(2)
    expect(container.querySelectorAll("line")).toHaveLength(1)
  })
})
