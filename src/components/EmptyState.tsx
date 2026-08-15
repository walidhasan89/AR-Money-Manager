import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-glass-surface border-glass-border flex size-12 items-center justify-center rounded-full border">
        <Icon size={22} strokeWidth={1.5} className="text-text-secondary" aria-hidden />
      </div>
      <p className="text-text-primary font-medium">{title}</p>
      {description && <p className="text-text-secondary max-w-sm text-sm">{description}</p>}
    </div>
  )
}
