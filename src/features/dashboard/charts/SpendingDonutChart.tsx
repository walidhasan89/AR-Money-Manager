import { useReducedMotion } from 'framer-motion'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { EmptyState } from '../../../components/EmptyState'
import { formatCurrency } from '../../../lib/format/currency'
import type { CategorySpend } from '../../../lib/ipc/types'
import { ChartTooltip } from './ChartTooltip'

interface SpendingDonutChartProps {
  data: CategorySpend[]
}

interface DonutTooltipPayload {
  payload: CategorySpend
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: DonutTooltipPayload[] }) {
  const slice = active ? payload?.[0]?.payload : undefined
  if (!slice) return null
  return (
    <ChartTooltip
      rows={[
        {
          key: slice.categoryId,
          label: slice.categoryName,
          value: formatCurrency(slice.amountCents),
          color: slice.categoryColor,
        },
      ]}
    />
  )
}

export function SpendingDonutChart({ data }: SpendingDonutChartProps) {
  const prefersReducedMotion = useReducedMotion()

  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No spending yet"
        description="Add an expense this month to see the breakdown by category."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amountCents"
              nameKey="categoryName"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={!prefersReducedMotion}
              animationDuration={500}
              animationEasing="ease-out"
            >
              {data.map((slice) => (
                <Cell key={slice.categoryId} fill={slice.categoryColor} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {data.map((slice) => (
          <div key={slice.categoryId} className="flex items-center gap-1.5 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: slice.categoryColor }}
              aria-hidden
            />
            <span className="text-text-primary">{slice.categoryName}</span>
            <span className="text-text-secondary tabular-nums">
              {formatCurrency(slice.amountCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
