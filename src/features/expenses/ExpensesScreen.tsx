import { useState } from 'react'
import { ExpensesTable } from './ExpensesTable'
import { FixedExpensesTab } from './FixedExpensesTab'

const TABS = ['Expenses', 'Fixed Expenses'] as const
type Tab = (typeof TABS)[number]

export function ExpensesScreen() {
  const [tab, setTab] = useState<Tab>('Expenses')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Expenses</h1>
        <div className="border-glass-border flex gap-1 rounded-control border p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-control px-3 py-1.5 text-sm transition-colors ${
                tab === t
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Expenses' ? <ExpensesTable /> : <FixedExpensesTab />}
    </div>
  )
}
