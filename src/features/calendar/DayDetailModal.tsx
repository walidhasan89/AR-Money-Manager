import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, parse } from 'date-fns'
import { X } from 'lucide-react'
import { listExpenses, listIncome } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { getCategoryIcon } from '../../lib/icons'
import { getErrorMessage } from '../../lib/ipc/types'
import type { Expense, Income } from '../../lib/ipc/types'
import { useEscapeToClose } from '../../lib/useEscapeToClose'
import { useToastStore } from '../../store/toastStore'

interface DayDetailModalProps {
  date: string | null
  onClose: () => void
}

function dateLabel(date: string): string {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')
}

/** Opened by clicking a Calendar day cell — the full income/expense breakdown
 * for that one date, reusing the same filtered list commands the Expenses/
 * Income screens use (dateFrom === dateTo scopes them to a single day). */
export function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const showToast = useToastStore((s) => s.showToast)
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])

  useEffect(() => {
    if (!date) return
    Promise.all([
      listExpenses({ dateFrom: date, dateTo: date }),
      listIncome({ dateFrom: date, dateTo: date }),
    ])
      .then(([nextExpenses, nextIncome]) => {
        setExpenses(nextExpenses)
        setIncome(nextIncome)
        setLoadedDate(date)
      })
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  useEscapeToClose(date !== null, onClose)

  const loading = date !== null && date !== loadedDate

  const isEmpty = !loading && expenses.length === 0 && income.length === 0
  const totalIncome = income.reduce((sum, e) => sum + e.amountCents, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountCents, 0)

  return (
    <AnimatePresence>
      {date && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-glass-modal-backdrop"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Activity on ${dateLabel(date)}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="glass-modal relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden p-6"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-text-secondary hover:text-text-primary absolute top-4 right-4"
            >
              <X size={18} strokeWidth={1.75} />
            </button>

            <h2 className="text-text-primary mb-1 text-lg font-semibold">{dateLabel(date)}</h2>
            {!isEmpty && !loading && (
              <p className="text-text-secondary mb-4 text-sm">
                <span className="text-accent-success font-medium">
                  +{formatCurrency(totalIncome)}
                </span>{' '}
                ·{' '}
                <span className="text-accent-danger font-medium">
                  -{formatCurrency(totalExpenses)}
                </span>
              </p>
            )}

            <div className="flex flex-col gap-4 overflow-y-auto">
              {loading ? (
                <p className="text-text-secondary text-sm">Loading…</p>
              ) : isEmpty ? (
                <p className="text-text-secondary py-6 text-center text-sm">
                  No income or expenses on this day.
                </p>
              ) : (
                <>
                  {income.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                        Income
                      </h3>
                      {income.map((entry) => {
                        const Icon = getCategoryIcon(entry.categoryIcon)
                        return (
                          <div
                            key={entry.id}
                            className="border-glass-border flex items-center justify-between gap-3 rounded-control border px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.categoryColor }}
                                aria-hidden
                              />
                              <Icon
                                size={14}
                                strokeWidth={1.75}
                                className="text-text-secondary shrink-0"
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <p className="text-text-primary truncate text-sm">
                                  {entry.categoryName}
                                </p>
                                {entry.note && (
                                  <p className="text-text-secondary truncate text-xs">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-accent-success shrink-0 text-sm font-medium tabular-nums">
                              +{formatCurrency(entry.amountCents)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {expenses.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                        Expenses
                      </h3>
                      {expenses.map((entry) => {
                        const Icon = getCategoryIcon(entry.categoryIcon)
                        return (
                          <div
                            key={entry.id}
                            className="border-glass-border flex items-center justify-between gap-3 rounded-control border px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.categoryColor }}
                                aria-hidden
                              />
                              <Icon
                                size={14}
                                strokeWidth={1.75}
                                className="text-text-secondary shrink-0"
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <p className="text-text-primary truncate text-sm">
                                  {entry.categoryName}
                                </p>
                                {entry.note && (
                                  <p className="text-text-secondary truncate text-xs">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-accent-danger shrink-0 text-sm font-medium tabular-nums">
                              -{formatCurrency(entry.amountCents)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
