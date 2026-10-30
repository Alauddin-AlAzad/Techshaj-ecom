import { ArrowLeft, X } from 'lucide-react'
import { useEffect } from 'react'
import { useCartStore } from '../../context/useCartStore.js'
import { useCart } from '../../hooks/useCart.js'
import CartItem from './CartItem.jsx'
import CartSummary from './CartSummary.jsx'
import EmptyCart from './EmptyCart.jsx'
import ErrorState from '../ErrorState.jsx'
import FreeShippingBar from './FreeShippingBar.jsx'

// Figma "Cart Drawer – Desktop 1440" (31:3327). Desktop only; mobile uses the /cart page.
export default function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen)
  const close = useCartStore((s) => s.closeDrawer)
  const cart = useCart()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 hidden lg:block">
      <button type="button" aria-label="Close cart" onClick={close} className="absolute inset-0 size-full bg-dark/55" />
      <div role="dialog" aria-modal="true" aria-label="Your cart" className="absolute inset-y-0 right-0 flex w-[440px] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.3px] text-text">
            Your Cart
            {cart.count > 0 && <span className="rounded-[10px] bg-highlight px-2 py-0.5 font-body text-label-sm font-bold">{cart.count}</span>}
          </h2>
          <button type="button" onClick={close} aria-label="Close cart" className="flex size-9 items-center justify-center rounded-full bg-fill text-text">
            <X size={18} />
          </button>
        </div>

        {!cart.ready && cart.isError ? (
          <ErrorState title="Could not load your cart" onRetry={cart.refetch} />
        ) : !cart.ready ? null : cart.lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyCart onNavigate={close} />
          </div>
        ) : (
          <>
            <FreeShippingBar totals={cart} />
            <ul className="flex-1 overflow-y-auto">
              {cart.lines.map((line) => (
                <CartItem key={line.key} line={line} onNavigate={close} />
              ))}
            </ul>
            <div className="border-t border-border px-5 pt-[18px] pb-5">
              <CartSummary totals={cart} onCheckout={close} />
              <button type="button" onClick={close} className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-label text-text-secondary">
                <ArrowLeft size={16} />
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
