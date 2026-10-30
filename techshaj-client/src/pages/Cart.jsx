import CartItem from '../components/cart/CartItem.jsx'
import CartSummary from '../components/cart/CartSummary.jsx'
import EmptyCart from '../components/cart/EmptyCart.jsx'
import ErrorState from '../components/ErrorState.jsx'
import FreeShippingBar from '../components/cart/FreeShippingBar.jsx'
import PageTopBar from '../components/PageTopBar.jsx'
import { useCart } from '../hooks/useCart.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

// Figma "Cart – Mobile 390" (33:3413). Desktop uses the drawer; this page lays the same parts out side by side.
export default function Cart() {
  usePageTitle('Your Cart')
  const cart = useCart()
  const empty = cart.ready && cart.lines.length === 0

  return (
    <div className="lg:bg-surface lg:py-8">
      <PageTopBar>
        <h1 className="text-[18px] font-bold tracking-[-0.27px] text-text">Your Cart</h1>
        {cart.count > 0 && (
          <span className="rounded-[10px] bg-highlight px-2 py-0.5 text-[11px] font-bold text-text">
            {cart.count} {cart.count === 1 ? 'item' : 'items'}
          </span>
        )}
      </PageTopBar>

      <div className="lg:site-container">
        <h1 className="mb-5 hidden items-center gap-2 text-h2 text-text lg:flex">
          Your Cart
          {cart.count > 0 && <span className="rounded-[10px] bg-highlight px-2 py-0.5 font-body text-label-sm font-bold">{cart.count}</span>}
        </h1>

        {!cart.ready && cart.isError ? (
          <ErrorState title="Could not load your cart" onRetry={cart.refetch} />
        ) : !cart.ready ? (
          <div className="min-h-[60vh]" />
        ) : empty ? (
          <div className="pt-20 lg:rounded-2xl lg:bg-white lg:pt-0">
            <EmptyCart />
          </div>
        ) : (
          <div className="pb-[calc(206px+env(safe-area-inset-bottom))] lg:flex lg:items-start lg:gap-6 lg:pb-0">
            <div className="lg:flex-1 lg:overflow-hidden lg:rounded-2xl lg:bg-white">
              <FreeShippingBar totals={cart} />
              <ul>
                {cart.lines.map((line) => (
                  <CartItem key={line.key} line={line} />
                ))}
              </ul>
            </div>
            <CartSummary
              totals={cart}
              mobileSubtotal={false}
              className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-white px-4 pt-3.5 pb-4 lg:static lg:w-[400px] lg:rounded-2xl lg:border-0 lg:p-5"
            />
          </div>
        )}
      </div>
    </div>
  )
}
