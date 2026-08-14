import { Target } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function BudgetsScreen() {
  return (
    <PlaceholderScreen
      title="Budgets"
      icon={Target}
      phase={3}
      description="Overall and per-category monthly budgets with live budget-vs-actual."
    />
  )
}
