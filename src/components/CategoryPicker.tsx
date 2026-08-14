import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Category } from '../lib/ipc/types'
import { getCategoryIcon } from '../lib/icons'

interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (id: string) => void
  error?: string
}

/** Searchable chip picker; defaults to whatever the caller pre-selects (last-used). */
export function CategoryPicker({ categories, value, onChange, error }: CategoryPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(q))
  }, [categories, query])

  return (
    <div>
      <div className="border-glass-border focus-within:border-accent-primary mb-2 flex items-center gap-2 rounded-control border bg-black/10 px-3 py-2">
        <Search size={14} strokeWidth={1.75} className="text-text-secondary" aria-hidden />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="text-text-primary placeholder:text-text-secondary/50 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto" role="listbox">
        {filtered.map((category) => {
          const Icon = getCategoryIcon(category.icon)
          const selected = category.id === value
          return (
            <button
              key={category.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(category.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                selected
                  ? 'border-accent-primary bg-accent-primary/15 text-text-primary'
                  : 'border-glass-border text-text-secondary hover:text-text-primary hover:border-glass-border-hover'
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <Icon size={14} strokeWidth={1.75} aria-hidden />
              {category.name}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-text-secondary py-2 text-sm">No matching categories.</p>
        )}
      </div>
      {error && <p className="text-accent-danger mt-1 text-xs">{error}</p>}
    </div>
  )
}
