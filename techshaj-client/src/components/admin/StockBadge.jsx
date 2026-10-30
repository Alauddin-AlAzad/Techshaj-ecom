import { Truck } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export const LOW_STOCK = 5

// Product table stock pill: red when out, yellow when 1 to 5 are left.
export default function StockBadge({ stock, className }) {
  const out = !(stock > 0)
  const low = !out && stock <= LOW_STOCK
  return (
    <span
      className={cn(
        'inline-flex rounded-[10px] px-2 py-[3px] text-label-sm whitespace-nowrap',
        out ? 'bg-error-tint text-error' : low ? 'bg-highlight-soft text-highlight-ink' : 'bg-success-tint text-success',
        className,
      )}
    >
      {out ? 'Out of stock' : low ? `Low · ${stock} left` : `${stock} in stock`}
    </span>
  )
}

export function FreeDeliveryBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-highlight-soft py-[3px] pr-[7px] pl-1.5 text-[10.5px] font-bold whitespace-nowrap text-highlight-ink">
      <Truck size={12} />
      Free delivery
    </span>
  )
}
