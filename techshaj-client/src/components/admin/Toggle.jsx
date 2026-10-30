import { cn } from '../../lib/cn.js'

export default function Toggle({ checked, onChange, label, disabled = false, className }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5', disabled && 'cursor-not-allowed opacity-50', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : 'Toggle'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-check-line')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-5')} />
      </button>
      {label && <span className="text-body text-text">{label}</span>}
    </label>
  )
}
