interface ChartTooltipRow {
  key: string
  label: string
  value: string
  color: string
}

interface ChartTooltipProps {
  title?: string
  rows: ChartTooltipRow[]
}

/** Shared glass-styled tooltip content for Recharts `content` props. */
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  if (rows.length === 0) return null
  return (
    <div className="bg-glass-surface-fallback border-glass-border rounded-control border px-3 py-2 shadow-lg">
      {title && <p className="text-text-secondary mb-1 text-xs">{title}</p>}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-sm">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
            <span className="text-text-primary font-medium tabular-nums">{row.value}</span>
            <span className="text-text-secondary">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
