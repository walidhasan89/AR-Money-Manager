import { useReducedMotion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { EmptyState } from '../../../components/EmptyState'
import { formatCurrency } from '../../../lib/format/currency'
import type { DailySpend } from '../../../lib/ipc/types'
import { ChartTooltip } from './ChartTooltip'

interface DailySpendingChartProps {
  data: DailySpend[]
}

function dayOfMonth(date: string): string {
  return String(Number(date.slice(-2)))
}

interface DailyTooltipPayload {
  payload: DailySpend
}

function DailyTooltip({ active, payload }: { active?: boolean; payload?: DailyTooltipPayload[] }) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null
  return (
    <ChartTooltip
      title={point.date}
      rows={[
        {
          key: point.date,
          label: 'Spent',
          value: formatCurrency(point.amountCents),
          color: 'var(--accent-primary)',
        },
      ]}
    />
  )
}

export function DailySpendingChart({ data }: DailySpendingChartProps) {
  const prefersReducedMotion = useReducedMotion()
  const hasSpending = data.some((d) => d.amountCents > 0)

  if (!hasSpending) {
    return (
      <div className="min-h-56 flex-1">
        <EmptyState
          icon={BarChart3}
          title="No spending yet"
          description="Daily spending for this month will appear here once you log an expense."
        />
      </div>
    )
  }

  return (
    // Grows to fill whatever height the row ends up at (matching its
    // "Spending by Category" sibling, whose own height varies with how many
    // legend rows it wraps to) instead of a fixed pixel height that left a
    // visible gap under this card on months with many categories.
    <div className="min-h-56 flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--glass-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={dayOfMonth}
            interval={Math.ceil(data.length / 8) - 1}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--glass-border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => formatCurrency(value).replace(/\.\d{2}$/, '')}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<DailyTooltip />} cursor={{ fill: 'var(--glass-surface-fallback)' }} />
          <Bar
            dataKey="amountCents"
            fill="var(--accent-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
            isAnimationActive={!prefersReducedMotion}
            animationDuration={500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
