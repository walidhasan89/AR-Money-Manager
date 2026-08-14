import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  PiggyBank,
  BarChart3,
  DatabaseBackup,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/income', label: 'Income', icon: Wallet },
  { path: '/budgets', label: 'Budgets', icon: Target },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/backup', label: 'Backup', icon: DatabaseBackup },
  { path: '/settings', label: 'Settings', icon: Settings },
]
