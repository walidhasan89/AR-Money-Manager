import { Outlet } from 'react-router-dom'
import { SidebarNavItem } from '../components/SidebarNavItem'
import { ThemeToggle } from '../components/ThemeToggle'
import { navItems } from './navConfig'

export function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="glass-card m-3 mr-0 flex w-60 shrink-0 flex-col gap-1 rounded-card p-3">
        <div className="text-text-primary px-3 pt-2 pb-4 text-sm font-semibold tracking-wide">
          Personal Finance
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              to={item.path}
              label={item.label}
              icon={item.icon}
              end={item.path === '/'}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-glass-border flex h-16 shrink-0 items-center justify-end gap-3 border-b px-6">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
