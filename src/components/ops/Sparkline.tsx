import { useId } from "react"
import type { SparklineColor, SparklineProps } from "@reliaforge/plugin-sdk"
import { cn } from "@/lib/utils"

export type { SparklineColor, SparklineProps }

const TOKEN_COLORS: Record<string, string> = {
  accent: "rgb(var(--accent))",
  success: "rgb(var(--success))",
  warning: "rgb(var(--warning))",
  danger: "rgb(var(--danger))",
  info: "rgb(var(--info))",
  muted: "rgb(var(--muted))",
}

function resolveStrokeColor(color: SparklineColor): string {
  return TOKEN_COLORS[color] ?? color
}

function buildSparklineGeometry(
  values: number[],
  width: number,
  height: number,
  explicitMin?: number,
  explicitMax?: number,
) {
  const pad = 2
  const innerW = Math.max(1, width - pad * 2)
  const innerH = Math.max(1, height - pad * 2)
  const clean = values.filter((v) => Number.isFinite(v))

  if (clean.length === 0) {
    return { points: "", areaPoints: "", empty: true }
  }

  const rawMin = explicitMin ?? Math.min(...clean)
  const rawMax = explicitMax ?? Math.max(...clean)
  const span = rawMax - rawMin

  const coords = clean.map((val, idx) => {
    const x = clean.length === 1 ? pad + innerW / 2 : pad + (idx / (clean.length - 1)) * innerW
    const ratio = span === 0 ? 0.5 : (val - rawMin) / span
    const y = pad + (1 - Math.max(0, Math.min(1, ratio))) * innerH
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const
  })

  if (coords.length === 1) {
    const [, y] = coords[0]
    const linePts = `${pad},${y} ${width - pad},${y}`
    const areaPts = `${pad},${height} ${linePts} ${width - pad},${height}`
    return { points: linePts, areaPoints: areaPts, empty: false }
  }

  const linePts = coords.map(([x, y]) => `${x},${y}`).join(" ")
  const areaPts = `${coords[0][0]},${height} ${linePts} ${coords[coords.length - 1][0]},${height}`
  return { points: linePts, areaPoints: areaPts, empty: false }
}

export function Sparkline({
  values,
  color = "accent",
  height = 28,
  width = 96,
  fill = true,
  min,
  max,
  label,
  className,
}: SparklineProps) {
  const gradientId = useId()
  const stroke = resolveStrokeColor(color)
  const { points, areaPoints, empty } = buildSparklineGeometry(values, width, height, min, max)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("block overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {fill && !empty ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      {empty ? (
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="rgb(var(--line))"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
      ) : (
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      )}
    </svg>
  )
}
