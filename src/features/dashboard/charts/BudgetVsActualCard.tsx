import { Link } from 'react-router-dom'
import { Target } from 'lucide-react'
import { BudgetBar } from '../../../components/BudgetBar'
import { EmptyState } from '../../../components/EmptyState'
import type { CategoryBudget } from '../../../lib/ipc/types'

interface BudgetVsActualCardProps {
  categories: CategoryBudget[]
}

const MAX_ROWS = 6

export function BudgetVsActualCard({ categories }: BudgetVsActualCardProps) {
  const active = categories
    .filter((c) => c.budgetCents > 0 || c.spentCents > 0)
    .sort((a, b) => b.spentCents - a.spentCents)

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No budgets set"
        description="Set a monthly budget per category to track spending against it here."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {active.slice(0, MAX_ROWS).map((category) => (
        <BudgetBar
          key={category.categoryId}
          label={category.categoryName}
          spentCents={category.spentCents}
          budgetCents={category.budgetCents}
          dotColor={category.categoryColor}
        />
      ))}
      {active.length > MAX_ROWS && (
        <Link to="/budgets" className="text-accent-primary self-start text-sm">
          View all {active.length} categories
        </Link>
      )}
    </div>
  )
}
