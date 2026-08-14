import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * Base glass panel — dashboard tiles, chart containers, modals, Quick Add.
 * Never nest a GlassCard inside another one (docs/ui-ux/DESIGN_SYSTEM.md).
 */
export function GlassCard({ children, className = '', ...rest }: GlassCardProps) {
  return (
    <div className={`glass-card p-6 ${className}`} {...rest}>
      {children}
    </div>
  )
}
