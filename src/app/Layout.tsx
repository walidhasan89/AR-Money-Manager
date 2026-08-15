import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SidebarNavItem } from '../components/SidebarNavItem'
import { SidebarFooter } from '../components/SidebarFooter'
import { ThemeToggle } from '../components/ThemeToggle'
import { CommandPalette } from './CommandPalette'
import { navItems } from './navConfig'

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="glass-card m-3 mr-0 flex w-60 shrink-0 flex-col gap-1 rounded-card p-3">
        <div className="text-text-primary px-3 pt-2 pb-4 text-sm font-semibold tracking-wide">
          AR Money Management
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
              iconColor={item.iconColor}
              end={item.path === '/'}
            />
          ))}
        </nav>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-glass-border flex h-16 shrink-0 items-center justify-end gap-3 border-b px-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {/* docs/ui-ux/DESIGN_SYSTEM.md: page/route transition is a fade +
              8px slide-up, 200ms ease-out. Exit is a quick opacity-only fade
              so `mode="wait"` never leaves two full-height screens stacked
              (their content heights differ, which would otherwise jump). */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
