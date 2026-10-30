import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// Native select styled like the Figma filter dropdowns (59:8184).
export default function Select({ className, error, children, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border border-border-strong bg-white pr-9 pl-3 text-[13px] font-medium text-text-secondary outline-none focus:border-primary',
          error && 'border-error bg-error-wash',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted" />
    </div>
  )
}
