import { Receipt } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function ExpensesScreen() {
  return (
    <PlaceholderScreen
      title="Expenses"
      icon={Receipt}
      phase={2}
      description="Quick Add, full CRUD, search/filter, and fixed/recurring expenses."
    />
  )
}
