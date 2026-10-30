import { Check, Truck } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import { formatDate, formatDateTime, formatPrice } from '../../lib/format.js'
import { expectedDelivery, itemCount, STATUS_LABELS } from '../../lib/order.js'

const STATUS_STYLES = {
  delivered: 'bg-success-tint text-success',
  cancelled: 'bg-error-tint text-error',
  placed: 'bg-info-tint text-info',
  confirmed: 'bg-info-tint text-info',
}

const CURRENT_NOTES = {
  'order-placed': 'We will call to confirm',
  confirmed: 'Packing your order',
  shipped: 'With courier, on the way',
  'out-for-delivery': 'Rider is on the way',
}

function stepNote(step, i, current, order, zones) {
  if (step.done && i !== current) return formatDateTime(step.date)
  if (i === current) return CURRENT_NOTES[step.key] ?? formatDateTime(step.date)
  if (step.key === 'delivered') return `Expected ${expectedDelivery(order, zones).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  return 'Pending'
}

// Figma "Tracking Result": horizontal timeline on desktop (34:3548), vertical on mobile (34:3853).
export default function TrackingResult({ order, zones }) {
  const steps = order.steps
  const lastDone = steps.findLastIndex((s) => s.done)
  // The last finished step is highlighted as current unless the order is complete.
  const current = lastDone === steps.length - 1 ? -1 : lastDone
  const count = itemCount(order)
  const half = 50 / steps.length

  return (
    <article className="flex w-full flex-col gap-5 rounded-2xl border border-border bg-white p-4 lg:px-8 lg:py-7">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-[15px] font-bold tracking-[-0.225px] text-text lg:text-[17px] lg:tracking-[-0.255px]">Order {order.id}</h2>
          <p className="text-body-sm text-text-muted">
            Placed on {formatDate(order.placedAt)}  ·  {count} {count === 1 ? 'item' : 'items'}  ·  {formatPrice(order.total)}
          </p>
        </div>
        <span className={cn('shrink-0 rounded-[14px] bg-highlight-soft px-3 py-[5px] text-body-sm font-bold text-highlight-ink', STATUS_STYLES[order.status])}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </header>

      <ol className="relative flex flex-col gap-[18px] lg:flex-row lg:gap-0">
        <span aria-hidden="true" className="absolute top-[15px] hidden h-[3px] bg-nav-line lg:block" style={{ left: `${half}%`, right: `${half}%` }} />
        <span
          aria-hidden="true"
          className="absolute top-[15px] hidden h-[3px] bg-primary lg:block"
          style={{ left: `${half}%`, width: `${(Math.max(0, lastDone) / steps.length) * 100}%` }}
        />
        {steps.map((step, i) => {
          const isCurrent = i === current
          return (
            <li key={step.key} className="relative flex items-start gap-3 lg:flex-1 lg:flex-col lg:items-center lg:gap-2.5 lg:text-center">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-body-sm font-bold',
                  isCurrent ? 'bg-highlight text-text' : step.done ? 'bg-stock text-white' : 'border border-border-strong bg-fill text-text-faint',
                )}
              >
                {isCurrent ? <Truck size={16} /> : step.done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className={cn('text-body font-bold', step.done ? 'text-text' : 'text-text-faint')}>{step.label}</span>
                <span className="text-body-sm text-text-muted">{stepNote(step, i, current, order, zones)}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <p className="flex items-center gap-2.5 rounded-[10px] bg-fill-soft px-3.5 py-3 text-[13px] font-medium whitespace-pre text-text-secondary">
        <Truck size={18} className="shrink-0 text-text" />
        {order.courier ? (
          <span className="min-w-0 truncate">
            <span className="hidden lg:inline">Courier: </span>
            {order.courier.name}  •  <span className="hidden lg:inline">Tracking: </span>
            <a href={order.courier.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold text-text underline-offset-2 hover:underline">
              {order.courier.trackingId}
            </a>
          </span>
        ) : (
          <span className="whitespace-normal">The courier tracking number will appear here once your order ships.</span>
        )}
      </p>
    </article>
  )
}
