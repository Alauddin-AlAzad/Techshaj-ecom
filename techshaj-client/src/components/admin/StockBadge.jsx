import { Truck } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export const LOW_STOCK = 5

// Figma product table stock pill (59:8184): red when low, gray when out.
export default function StockBadge({ stock }) {
  const out = !(stock > 0)
  const low = !out && stock <= LOW_STOCK
  return (
    <span
      className={cn(
        'inline-flex rounded-[10px] px-2 py-[3px] text-label-sm whitespace-nowrap',
        out ? 'bg-fill text-text-muted' : low ? 'bg-error-tint text-error' : 'bg-success-tint text-success',
      )}
    >
      {out ? 'Out of stock' : `${stock} in stock`}
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
