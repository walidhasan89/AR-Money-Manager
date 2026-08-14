import { LayoutDashboard } from 'lucide-react'
import { GlassCard } from '../../components/GlassCard'
import { EmptyState } from '../../components/EmptyState'
import { PendingFixedExpensesWidget } from './PendingFixedExpensesWidget'

export function DashboardScreen() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Dashboard</h1>

      <PendingFixedExpensesWidget />

      <GlassCard>
        <EmptyState
          icon={LayoutDashboard}
          title="Coming in Phase 4"
          description="KPI tiles and charts answering the six core money questions will live here."
        />
      </GlassCard>
    </div>
  )
}
