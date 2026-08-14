import { PiggyBank } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function SavingsScreen() {
  return (
    <PlaceholderScreen
      title="Savings"
      icon={PiggyBank}
      phase={5}
      description="General savings, DPS, emergency fund, and goal tracking with progress."
    />
  )
}
