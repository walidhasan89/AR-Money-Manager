import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './app/Layout'
import { ThemeProvider } from './app/ThemeProvider'
import { useGlobalShortcuts } from './app/useGlobalShortcuts'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { QuickAddExpenseModal } from './features/expenses/QuickAddExpenseModal'
import { IncomeScreen } from './features/income/IncomeScreen'
import { AddIncomeModal } from './features/income/AddIncomeModal'
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
      <RouterProvider router={router} />
      <GlobalOverlays />
    </ThemeProvider>
  )
}
