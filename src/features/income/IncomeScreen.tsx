import { Wallet } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function IncomeScreen() {
  return (
    <PlaceholderScreen
      title="Income"
      icon={Wallet}
      phase={2}
      description="Track salary, business, and freelance income entries."
    />
  )
}
