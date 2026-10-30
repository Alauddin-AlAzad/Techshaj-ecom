import { Truck } from 'lucide-react'
import { formatPrice } from '../../lib/format.js'

// "Add ৳X more to get free shipping" with the progress track (Figma 31:3337, 33:3421).
export default function FreeShippingBar({ totals }) {
  const { freeShipping, remaining, progress } = totals

  return (
    <div className="flex flex-col gap-2 bg-fill-soft px-4 py-3 lg:px-5 lg:py-4">
      <p className="flex items-center gap-1.5 text-body-sm text-text-secondary lg:text-[13px]">
        <Truck className="size-[15px] shrink-0 text-text-secondary lg:size-4" />
        {freeShipping ? (
          <span className="font-semibold text-success">You&apos;ve unlocked free shipping!</span>
        ) : (
          <span>
            Add <b className="font-bold text-text">{formatPrice(remaining)}</b> more to get free shipping
          </span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-nav-line">
        <div className="h-full rounded-[3px] bg-primary transition-[width]" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
    </div>
  )
}
