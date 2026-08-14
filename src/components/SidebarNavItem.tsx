import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface SidebarNavItemProps {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function SidebarNavItem({ to, label, icon: Icon, end }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'text-text-primary bg-glass-surface'
            : 'text-text-secondary hover:text-text-primary hover:bg-glass-surface',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="bg-accent-primary absolute inset-y-1 left-0 w-0.5 rounded-full shadow-[0_0_8px_var(--accent-primary)]" />
          )}
          <Icon size={18} strokeWidth={1.75} aria-hidden />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
