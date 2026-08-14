import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '../lib/format/currency'
import { GlassCard } from './GlassCard'

interface KpiTileProps {
  label: string
  valueCents: number
  icon: LucideIcon
  tone?: 'default' | 'success' | 'danger'
}

const TONE_CLASS: Record<NonNullable<KpiTileProps['tone']>, string> = {
  default: 'text-text-primary',
  success: 'text-accent-success',
  danger: 'text-accent-danger',
}

/** Counts up from the previous value to the new one, per DESIGN_SYSTEM.md (500-700ms). */
export function KpiTile({ label, valueCents, icon: Icon, tone = 'default' }: KpiTileProps) {
  const [displayCents, setDisplayCents] = useState(valueCents)
  const previousRef = useRef(valueCents)

  useEffect(() => {
    const controls = animate(previousRef.current, valueCents, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (value) => setDisplayCents(Math.round(value)),
    })
    previousRef.current = valueCents
    return () => controls.stop()
  }, [valueCents])

  return (
    <GlassCard className="flex flex-col gap-2">
      <div className="text-text-secondary flex items-center gap-2 text-sm">
        <Icon size={15} strokeWidth={1.75} aria-hidden />
        {label}
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${TONE_CLASS[tone]}`}>
        {formatCurrency(displayCents)}
      </p>
    </GlassCard>
  )
}
