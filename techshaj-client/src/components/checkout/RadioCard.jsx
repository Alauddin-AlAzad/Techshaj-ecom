import { cn } from '../../lib/cn.js'

// Selectable card with a radio dot, used for delivery zones and payment methods.
export default function RadioCard({ checked, className, children, ...props }) {
  return (
    <label
      className={cn(
        'flex min-w-0 cursor-pointer items-center gap-2 rounded-[10px] border border-border-strong px-2.5',
        checked && 'border-[1.5px] border-primary bg-primary-tint',
        className,
      )}
    >
      <input type="radio" checked={checked} className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cn('size-[18px] shrink-0 rounded-full border-[1.5px] border-check-line peer-focus-visible:ring-2 peer-focus-visible:ring-primary-soft', checked && 'border-[5px] border-primary')}
      />
      {children}
    </label>
  )
}
