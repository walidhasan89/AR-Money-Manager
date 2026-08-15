import { createHashRouter, RouterProvider } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Layout } from './app/Layout'
import { ThemeProvider } from './app/ThemeProvider'
import { useGlobalShortcuts } from './app/useGlobalShortcuts'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { QuickAddExpenseModal } from './features/expenses/QuickAddExpenseModal'
import { IncomeScreen } from './features/income/IncomeScreen'
import { AddIncomeModal } from './features/income/AddIncomeModal'
import { CalendarScreen } from './features/calendar/CalendarScreen'
import { BudgetsScreen } from './features/budgets/BudgetsScreen'
import { SavingsScreen } from './features/savings/SavingsScreen'
import { ReportsScreen } from './features/reports/ReportsScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { ToastViewport } from './components/ToastViewport'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'expenses', element: <ExpensesScreen /> },
      { path: 'income', element: <IncomeScreen /> },
      { path: 'calendar', element: <CalendarScreen /> },
      { path: 'budgets', element: <BudgetsScreen /> },
      { path: 'savings', element: <SavingsScreen /> },
      { path: 'reports', element: <ReportsScreen /> },
      { path: 'backup', element: <BackupScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
    ],
  },
])

function GlobalOverlays() {
  useGlobalShortcuts()
  return (
    <>
      <QuickAddExpenseModal />
      <AddIncomeModal />
      <ToastViewport />
    </>
  )
}

export function App() {
  return (
    <ThemeProvider>
      {/* Modals and other motion.* components (scale/x/y transforms) drop
          those animations to instant when the OS's reduced-motion setting
          is on, per docs/ui-ux/DESIGN_SYSTEM.md's accessibility guardrails
          — the app-wide CSS rule in tokens.css only reaches plain CSS
          transitions/animations, not Framer Motion's own transforms.
          Bespoke value tweens (KPI count-up, chart draw-in) still check
          useReducedMotion() directly since they're not transform-based. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <GlobalOverlays />
      </MotionConfig>
    </ThemeProvider>
  )
}
