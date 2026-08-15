import type { LucideIcon } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { EmptyState } from './EmptyState'

interface PlaceholderScreenProps {
  title: string
  icon: LucideIcon
  phase: number
  description: string
}

/** Shared shell for a feature screen that hasn't been built yet — every
 * placeholder gets a real, designed empty state rather than a bare TODO. */
export function PlaceholderScreen({ title, icon, phase, description }: PlaceholderScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight">{title}</h1>
      <GlassCard>
        <EmptyState icon={icon} title={`Coming in Phase ${phase}`} description={description} />
      </GlassCard>
    </div>
  )
}
