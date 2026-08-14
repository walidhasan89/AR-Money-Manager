import { LayoutDashboard } from 'lucide-react'
import { PlaceholderScreen } from '../../components/PlaceholderScreen'

export function DashboardScreen() {
  return (
    <PlaceholderScreen
      title="Dashboard"
      icon={LayoutDashboard}
      phase={4}
      description="KPI tiles and charts answering the six core money questions will live here."
    />
  )
}
