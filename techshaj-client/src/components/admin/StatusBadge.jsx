import { cn } from '../../lib/cn.js'

// Figma order status pills (54:7988).
const statuses = {
  pending: { label: 'Pending', className: 'bg-highlight-soft text-highlight-ink' },
  confirmed: { label: 'Confirmed', className: 'bg-secondary-tint text-violet' },
  shipped: { label: 'Shipped', className: 'bg-info-tint text-info' },
  delivered: { label: 'Delivered', className: 'bg-success-tint text-success' },
  cancelled: { label: 'Cancelled', className: 'bg-error-tint text-error' },
}

export default function StatusBadge({ status, className }) {
  const s = statuses[status] ?? { label: status ?? 'Unknown', className: 'bg-fill text-text-secondary' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-label-sm whitespace-nowrap', s.className, className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  )
}
