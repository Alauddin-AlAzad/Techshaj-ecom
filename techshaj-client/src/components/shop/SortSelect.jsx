import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { SORTS } from '../../lib/shopFilters.js'

// A transparent native <select> over the Figma button keeps keyboard and screen-reader support.
export default function SortSelect({ value, onChange, className, iconFirst = false }) {
  const label = SORTS.find((s) => s.value === value)?.label ?? 'Newest'
  return (
    <div className={cn('relative flex items-center gap-2 border border-border-strong font-semibold text-text', className)}>
      {iconFirst && <ChevronDown className="size-4 shrink-0" />}
      <span className="whitespace-nowrap">Sort: {label}</span>
      {!iconFirst && <ChevronDown className="size-3.5 shrink-0" />}
      <select
        aria-label="Sort products"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
