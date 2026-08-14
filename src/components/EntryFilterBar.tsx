import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Category, EntryFilter } from '../lib/ipc/types'
import { parseAmountToCents } from '../lib/format/currency'

interface EntryFilterBarProps {
  categories: Category[]
  filter: EntryFilter
  onChange: (filter: EntryFilter) => void
}

/** Shared filter bar (date range + category multi-select + amount range + keyword), all combinable. */
export function EntryFilterBar({ categories, filter, onChange }: EntryFilterBarProps) {
  const [minInput, setMinInput] = useState('')
  const [maxInput, setMaxInput] = useState('')

  function toggleCategory(id: string) {
    const current = filter.categoryIds ?? []
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    onChange({ ...filter, categoryIds: next.length > 0 ? next : undefined })
  }

  const hasActiveFilters =
    filter.dateFrom ||
    filter.dateTo ||
    (filter.categoryIds && filter.categoryIds.length > 0) ||
    filter.minAmountCents !== undefined ||
    filter.maxAmountCents !== undefined ||
    filter.keyword

  return (
    <div className="glass-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="border-glass-border focus-within:border-accent-primary flex items-center gap-2 rounded-control border bg-black/10 px-3 py-2 transition-colors">
          <Search size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
          <input
            type="text"
            value={filter.keyword ?? ''}
            onChange={(e) => onChange({ ...filter, keyword: e.target.value || undefined })}
            placeholder="Search notes…"
            className="text-text-primary placeholder:text-text-secondary/50 w-40 bg-transparent text-sm outline-none"
          />
        </div>

        <input
          type="date"
          value={filter.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filter, dateFrom: e.target.value || undefined })}
          className="border-glass-border focus:border-accent-primary text-text-primary rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
          aria-label="From date"
        />
        <span className="text-text-secondary text-sm">to</span>
        <input
          type="date"
          value={filter.dateTo ?? ''}
          onChange={(e) => onChange({ ...filter, dateTo: e.target.value || undefined })}
          className="border-glass-border focus:border-accent-primary text-text-primary rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
          aria-label="To date"
        />

        <input
          type="text"
          inputMode="decimal"
          value={minInput}
          onChange={(e) => {
            setMinInput(e.target.value)
            const cents = parseAmountToCents(e.target.value)
            onChange({ ...filter, minAmountCents: cents ?? undefined })
          }}
          placeholder="Min amount"
          className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-28 rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
        />
        <span className="text-text-secondary text-sm">–</span>
        <input
          type="text"
          inputMode="decimal"
          value={maxInput}
          onChange={(e) => {
            setMaxInput(e.target.value)
            const cents = parseAmountToCents(e.target.value)
            onChange({ ...filter, maxAmountCents: cents ?? undefined })
          }}
          placeholder="Max amount"
          className="border-glass-border focus:border-accent-primary text-text-primary placeholder:text-text-secondary/50 w-28 rounded-control border bg-black/10 px-3 py-2 text-sm outline-none transition-colors"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setMinInput('')
              setMaxInput('')
              onChange({})
            }}
            className="text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm"
          >
            <X size={14} strokeWidth={1.75} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = (filter.categoryIds ?? []).includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
                  : 'border-glass-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              {category.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
