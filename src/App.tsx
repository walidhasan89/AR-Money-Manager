import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './app/Layout'
import { ThemeProvider } from './app/ThemeProvider'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { ExpensesScreen } from './features/expenses/ExpensesScreen'
import { IncomeScreen } from './features/income/IncomeScreen'
import { BudgetsScreen } from './features/budgets/BudgetsScreen'
import { SavingsScreen } from './features/savings/SavingsScreen'
import { ReportsScreen } from './features/reports/ReportsScreen'
import { BackupScreen } from './features/backup/BackupScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'

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

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
