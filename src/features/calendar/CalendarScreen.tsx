import { useCallback, useEffect, useState } from 'react'
import { format, getDay, parse } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '../../components/EmptyState'
import { GlassCard } from '../../components/GlassCard'
import { getCalendarSummary } from '../../lib/ipc/commands'
import { formatCurrency } from '../../lib/format/currency'
import { monthLabel, shiftMonth } from '../../lib/format/month'
import { getErrorMessage } from '../../lib/ipc/types'
import type { CalendarDay } from '../../lib/ipc/types'
import { useDataEventsStore } from '../../store/dataEventsStore'
import { useToastStore } from '../../store/toastStore'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarScreen() {
  const showToast = useToastStore((s) => s.showToast)
  const expensesVersion = useDataEventsStore((s) => s.expensesVersion)
  const incomeVersion = useDataEventsStore((s) => s.incomeVersion)
  const currentMonth = format(new Date(), 'yyyy-MM')
  const today = format(new Date(), 'yyyy-MM-dd')
  const [month, setMonth] = useState(currentMonth)
  const [days, setDays] = useState<CalendarDay[] | null>(null)

  const refresh = useCallback(() => {
    getCalendarSummary(month)
      .then(setDays)
      .catch((error) => showToast(getErrorMessage(error), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  useEffect(() => {
    refresh()
  }, [refresh, expensesVersion, incomeVersion])

  const hasActivity = days?.some((d) => d.incomeCents > 0 || d.expenseCents > 0) ?? false
  const leadingBlanks = days ? getDay(parse(`${month}-01`, 'yyyy-MM-dd', new Date())) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary text-2xl font-semibold tracking-tight">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            aria-label="Previous month"
            className="text-text-secondary hover:text-text-primary"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>
          <span className="text-text-primary w-32 text-center text-sm font-medium">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            aria-label="Next month"
            className="text-text-secondary hover:text-text-primary"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <GlassCard>
        {days === null ? (
          <p className="text-text-secondary text-sm">Loading…</p>
        ) : !hasActivity ? (
          <EmptyState
            icon={CalendarDays}
            title="No activity yet"
            description="Income and expenses for this month will appear on their dates once you log them."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-text-secondary flex items-center gap-1.5 text-xs">
                <span className="bg-accent-success size-2 rounded-full" aria-hidden />
                Income
              </span>
              <span className="text-text-secondary flex items-center gap-1.5 text-xs">
                <span className="bg-accent-danger size-2 rounded-full" aria-hidden />
                Expense
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="text-text-secondary py-1 text-center text-xs font-medium tracking-wide uppercase"
                >
                  {label}
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} aria-hidden />
              ))}
              {days.map((day) => {
                const dayNumber = Number(day.date.slice(-2))
                const isToday = day.date === today
                const hasEntries = day.incomeCents > 0 || day.expenseCents > 0
                return (
                  <div
                    key={day.date}
                    className={`border-glass-border flex min-h-24 flex-col gap-1 rounded-control border p-2 transition-colors ${
                      isToday
                        ? 'border-accent-primary bg-accent-primary/10'
                        : hasEntries
                          ? 'bg-glass-surface'
                          : ''
                    }`}
                  >
                    <span
                      className={`text-xs tabular-nums ${
                        isToday ? 'text-accent-primary font-semibold' : 'text-text-secondary'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {day.incomeCents > 0 && (
                      <span className="text-accent-success text-[11px] leading-tight font-semibold tabular-nums break-words">
                        +{formatCurrency(day.incomeCents)}
                      </span>
                    )}
                    {day.expenseCents > 0 && (
                      <span className="text-accent-danger text-[11px] leading-tight font-semibold tabular-nums break-words">
                        -{formatCurrency(day.expenseCents)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
