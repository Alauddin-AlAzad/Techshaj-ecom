import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { formatPrice } from '../../lib/format.js'

// The mobile cart frame has no Subtotal row (mobileSubtotal=false).
// Totals and the Order Now button shared by the drawer (31:3429) and the mobile cart (33:3504).
export default function CartSummary({ totals, mobileSubtotal = true, onCheckout, className }) {
  return (
    <div className={cn('flex flex-col gap-2.5 lg:gap-3', className)}>
      <p className={cn('flex justify-between text-[13px] lg:text-body', !mobileSubtotal && 'max-lg:hidden')}>
        <span className="text-text-muted">Subtotal</span>
        <span className="font-semibold text-text">{formatPrice(totals.subtotal)}</span>
      </p>
      {totals.savings > 0 && (
        <p className="flex justify-between text-[13px] lg:text-body">
          <span className="text-text-muted">You save</span>
          <span className="font-semibold text-stock-ink">−{formatPrice(totals.savings)}</span>
        </p>
      )}
      <p className="flex items-center justify-between text-text">
        <span className="text-[15px] font-bold lg:text-body-lg">Total</span>
        <span className="text-[20px] font-extrabold lg:text-[22px]">{formatPrice(totals.subtotal)}</span>
      </p>
      <Link
        to="/checkout"
        onClick={onCheckout}
        className="bg-brand-gradient flex h-[50px] items-center justify-center gap-2 rounded-[10px] text-[15px] font-bold text-white lg:h-[52px]"
      >
        Order Now
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
