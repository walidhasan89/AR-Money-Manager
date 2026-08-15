import { forwardRef, type InputHTMLAttributes } from 'react'

interface DateFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value: string
  onChange: (value: string) => void
  error?: string
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ value, onChange, error, className = '', ...rest }, ref) => {
    return (
      <div>
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`border-glass-border focus:border-accent-primary text-text-primary w-full rounded-control border bg-black/10 px-4 py-2.5 text-sm outline-none transition-colors ${className}`}
          {...rest}
        />
        {error && <p className="text-accent-danger mt-1 text-xs">{error}</p>}
      </div>
    )
  },
)
DateField.displayName = 'DateField'
