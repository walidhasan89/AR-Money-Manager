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
  /** Drawn from lib/categoryColors.ts's palette, so nav icons and category
   * dots read as one consistent color language across the app. */
  iconColor: string
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, iconColor: '#6C7CFF' },
  { path: '/expenses', label: 'Expenses', icon: Receipt, iconColor: '#FF8FB1' },
  { path: '/income', label: 'Income', icon: Wallet, iconColor: '#3DDC97' },
  { path: '/budgets', label: 'Budgets', icon: Target, iconColor: '#FFB648' },
  { path: '/savings', label: 'Savings', icon: PiggyBank, iconColor: '#4EA1FF' },
  { path: '/reports', label: 'Reports', icon: BarChart3, iconColor: '#8B7CFF' },
  { path: '/backup', label: 'Backup', icon: DatabaseBackup, iconColor: '#5CC8FF' },
  { path: '/settings', label: 'Settings', icon: Settings, iconColor: '#9AA3B2' },
]
