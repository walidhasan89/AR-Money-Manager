import { format, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { getCategoryIcon } from '../../lib/icons'
import { formatCurrency } from '../../lib/format/currency'
import type { Expense } from '../../lib/ipc/types'

interface RecentTransactionsPanelProps {
  transactions: Expense[]
}

export function RecentTransactionsPanel({ transactions }: RecentTransactionsPanelProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-text-primary font-medium">Recent Transactions</h2>
        <Link to="/expenses" className="text-accent-primary text-sm">
          View all
        </Link>
      </div>
      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Expenses you log this month will show up here."
        />
      ) : (
        <ul>
          {transactions.map((expense) => {
            const Icon = getCategoryIcon(expense.categoryIcon)
            return (
              <li
                key={expense.id}
                className="border-glass-border/50 flex items-center justify-between border-b py-2.5 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: expense.categoryColor }}
                    aria-hidden
                  />
                  <Icon size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {expense.note?.trim() || expense.categoryName}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {expense.categoryName} · {format(parseISO(expense.date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <span className="text-text-primary text-sm tabular-nums">
                  {formatCurrency(expense.amountCents)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
