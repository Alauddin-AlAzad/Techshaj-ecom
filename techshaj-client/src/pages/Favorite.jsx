import { Heart, ShoppingCart } from 'lucide-react'
import EmptyState from '../components/EmptyState.jsx'
import PageTopBar from '../components/PageTopBar.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { ProductGridSkeleton } from '../components/Skeleton.jsx'
import { useCartStore } from '../context/useCartStore.js'
import { useFavoriteStore } from '../context/useFavoriteStore.js'
import { getProductsByIds } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { useIsDesktop } from '../hooks/useMediaQuery.js'
import { notify } from '../lib/notify.jsx'
import { defaultVariant } from '../lib/product.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const itemsLabel = (n) => `${n} ${n === 1 ? 'item' : 'items'}`

// Figma "Wishlist" desktop (40:5570) and "Favorite" mobile (40:6126).
export default function Favorite() {
  usePageTitle('My Favorites')
  const ids = useFavoriteStore((s) => s.ids)
  // Newest favorite first.
  const products = useAsync(() => getProductsByIds([...ids].reverse()), [ids.join(',')])
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openDrawer)
  const isDesktop = useIsDesktop()
  const list = products?.filter((p) => ids.includes(p.id)) ?? []
  const inStock = list.filter((p) => p.stock > 0)

  const addAll = () => {
    inStock.forEach((p) => addItem(p.id, 1, defaultVariant(p)))
    const soldOut = list.length - inStock.length
    notify.success(`${itemsLabel(inStock.length)} added to cart`, {
      description: soldOut > 0 ? `${itemsLabel(soldOut)} sold out and skipped` : undefined,
    })
    if (isDesktop) openCart()
  }

  return (
    <div className="pb-24 lg:pb-[72px]">
      <PageTopBar back={false} className="gap-2.5">
        <h1 className="text-[18px] font-bold tracking-[-0.27px] text-text">My Favorites</h1>
        {list.length > 0 && <span className="rounded-[10px] bg-highlight px-2 py-0.5 text-[11px] font-bold text-text">{list.length}</span>}
      </PageTopBar>

      <div className="site-container">
        <div className="hidden items-center justify-between pt-9 lg:flex">
          <h1 className="flex items-center gap-2.5 text-h2 text-text">
            My Wishlist
            {list.length > 0 && <span className="rounded-[10px] bg-highlight px-[9px] py-[3px] font-body text-label-sm font-bold">{itemsLabel(list.length)}</span>}
          </h1>
          {inStock.length > 0 && (
            <button type="button" onClick={addAll} className="flex h-[42px] items-center gap-2 rounded-[10px] border-[1.5px] border-text px-4 text-[13px] font-bold text-text">
              <ShoppingCart size={17} />
              Add all to cart
            </button>
          )}
        </div>
        <p className="mt-5 hidden items-center gap-2 rounded-[10px] bg-fill-soft px-3.5 py-3 text-[13px] text-text-secondary lg:flex">
          <Heart size={16} className="text-primary" />
          Saved on this device. No account needed.
        </p>

        {!products ? (
          <ProductGridSkeleton
            count={ids.length || 4}
            className="grid grid-cols-2 gap-x-2.5 gap-y-4 pt-3.5 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-[22px] lg:pt-5 xl:grid-cols-5"
          />
        ) : list.length === 0 ? (
          <div className="pt-20 lg:pt-10">
            <EmptyState Icon={Heart} title="No favorites yet" text="Tap the heart on any product to save it here for later." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 pt-3.5 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-[22px] lg:pt-5 xl:grid-cols-5">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} orderOnHover />
              ))}
            </div>
            {inStock.length > 0 && (
              <button
                type="button"
                onClick={addAll}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-text text-[13px] font-bold text-text lg:hidden"
              >
                <ShoppingCart size={17} />
                Add all to cart
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
