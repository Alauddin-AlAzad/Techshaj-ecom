import { Check } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.js'

export function CheckRow({ label, count, checked, onChange, swatch }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className="group flex w-full items-center gap-2.5 text-left">
      {swatch ? (
        <span
          className={cn('size-4 shrink-0 rounded-full border border-swatch-line', checked && 'ring-2 ring-sky ring-offset-1')}
          style={{ backgroundColor: swatch }}
        />
      ) : (
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-[4px]',
            checked ? 'bg-primary text-white' : 'border border-check-line group-hover:border-primary',
          )}
        >
          {checked && <Check size={12} strokeWidth={3} />}
        </span>
      )}
      <span className={cn('min-w-0 flex-1 truncate text-[13px] text-text-secondary', checked && 'font-semibold')}>{label}</span>
      {count != null && <span className="text-body-sm text-text-faint">{count}</span>}
    </button>
  )
}

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn('rounded-2xl px-3 py-[7px] text-label-sm whitespace-nowrap', active ? 'bg-text text-white' : 'bg-fill text-text-secondary')}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn('flex h-6 w-11 shrink-0 items-center rounded-xl p-[3px] transition-colors', checked ? 'bg-primary' : 'bg-check-line')}
    >
      <span className={cn('size-[18px] rounded-full bg-white transition-transform', checked && 'translate-x-5')} />
    </button>
  )
}

// Remounted by key when value changes from outside.
function PriceInput({ value, onCommit, label, className }) {
  const [text, setText] = useState(value.toLocaleString('en-US'))

  const commit = () => {
    const n = Number(text.replace(/[^\d]/g, ''))
    if (text.trim() && Number.isFinite(n)) onCommit(n)
    else setText(value.toLocaleString('en-US'))
  }

  return (
    <label className={cn('flex min-w-0 flex-1 items-center rounded-lg border border-border-strong px-3 text-[13px] font-medium text-text focus-within:border-primary', className)}>
      <span aria-hidden="true">৳</span>
      <input
        aria-label={label}
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="h-full w-full min-w-0 bg-transparent outline-none"
      />
    </label>
  )
}

// bounds: { min, max }; value: [lo, hi]; onCommit fires on release / blur, not on every drag step.
// Give it key={`${lo}-${hi}`} so it resets when the committed value changes.
export function PriceRange({ bounds, value, onCommit, slider = true, inputClassName }) {
  const [range, setRange] = useState(value)

  const [lo, hi] = range
  const span = bounds.max - bounds.min || 1
  const pct = (v) => ((v - bounds.min) / span) * 100
  const clamp = (v) => Math.min(bounds.max, Math.max(bounds.min, v))
  const commit = (next) => onCommit(next[0] <= next[1] ? next : [next[1], next[0]])

  return (
    <div className="flex flex-col gap-3">
      {slider && (
        <div className="relative h-4">
          <div className="absolute inset-x-0 top-1.5 h-1 rounded-sm bg-nav-line" />
          <div className="absolute top-1.5 h-1 rounded-sm bg-primary" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
          {[0, 1].map((i) => (
            <input
              key={i}
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={50}
              value={range[i]}
              aria-label={i === 0 ? 'Minimum price' : 'Maximum price'}
              onChange={(e) => {
                const v = Number(e.target.value)
                setRange(i === 0 ? [Math.min(v, hi), hi] : [lo, Math.max(v, lo)])
              }}
              onPointerUp={() => commit(range)}
              onKeyUp={() => commit(range)}
              className="range-thumb absolute inset-0 h-4 w-full"
            />
          ))}
        </div>
      )}
      <div className="flex gap-2 lg:gap-2">
        <PriceInput key={`lo${lo}`} label="Minimum price" value={lo} onCommit={(v) => commit([clamp(v), hi])} className={inputClassName} />
        <PriceInput key={`hi${hi}`} label="Maximum price" value={hi} onCommit={(v) => commit([lo, clamp(v)])} className={inputClassName} />
      </div>
    </div>
  )
}
