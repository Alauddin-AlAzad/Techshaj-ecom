import { cn } from '../../lib/cn.js'

// Compact stepper from the cart and checkout frames: 28px cells below lg, 30px from lg.
export default function QtyStepper({ value, max = Infinity, onChange, className }) {
  const cell = 'flex size-7 items-center justify-center text-label text-text disabled:text-text-faint lg:size-[30px]'
  return (
    <div className={cn('flex shrink-0 items-center rounded-lg border border-border-strong', className)}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(value - 1)} className={cell}>
        −
      </button>
      <span aria-live="polite" className={cn(cell, 'border-x border-border-strong')}>
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} className={cell}>
        +
      </button>
    </div>
  )
}
