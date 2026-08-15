import { useReducedMotion } from 'framer-motion'
import { format, parse } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import { EmptyState } from '../../../components/EmptyState'
import { formatCurrency } from '../../../lib/format/currency'
import type { SavingsTrendPoint } from '../../../lib/ipc/types'
import { ChartTooltip } from './ChartTooltip'

interface SavingsTrendChartProps {
  data: SavingsTrendPoint[]
}

function monthLabel(month: string): string {
  return format(parse(month, 'yyyy-MM', new Date()), 'MMM')
}

interface TrendTooltipPayload {
  payload: SavingsTrendPoint
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: TrendTooltipPayload[] }) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null
  return (
    <ChartTooltip
      title={monthLabel(point.month)}
      rows={[
        {
          key: point.month,
          label: 'Saved',
          value: formatCurrency(point.totalCents),
          color: 'var(--accent-success)',
        },
      ]}
    />
  )
}

export function SavingsTrendChart({ data }: SavingsTrendChartProps) {
  const prefersReducedMotion = useReducedMotion()
  const hasSavings = data.some((d) => d.totalCents > 0)

  if (!hasSavings) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No savings tracked yet"
        description="The trend for your last 6 months of savings will show up here."
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--glass-border)" />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
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
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'var(--glass-border)' }} />
        <Area
          type="monotone"
          dataKey="totalCents"
          stroke="var(--accent-success)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#savingsTrendGradient)"
          dot={{ r: 4, fill: 'var(--accent-success)', stroke: 'var(--bg-base)', strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          isAnimationActive={!prefersReducedMotion}
          animationDuration={500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
