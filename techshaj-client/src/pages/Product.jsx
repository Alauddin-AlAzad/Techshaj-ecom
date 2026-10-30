import 'swiper/css'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ProductRow from '../components/home/ProductRow.jsx'
import BuyBox from '../components/product/BuyBox.jsx'
import DetailsTabs from '../components/product/DetailsTabs.jsx'
import Gallery from '../components/product/Gallery.jsx'
import { useCartStore } from '../context/useCartStore.js'
import ErrorState from '../components/ErrorState.jsx'
import { ProductDetailsSkeleton } from '../components/Skeleton.jsx'
import { useProduct } from '../hooks/useProduct.js'
import { useRelatedProducts } from '../hooks/useRelatedProducts.js'
import { useReviews } from '../hooks/useReviews.js'
import { useSettings } from '../hooks/useSettings.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { useIsDesktop } from '../hooks/useMediaQuery.js'
import { discountPercent, formatPrice } from '../lib/format.js'
import { notify } from '../lib/notify.jsx'
import { defaultVariant } from '../lib/product.js'
import { combine } from '../lib/query.js'
import NotFound from './NotFound.jsx'

// Keyed by slug from the route so state resets when moving between products.
function ProductDetails({ product, store, reviews, related }) {
  const [variant, setVariant] = useState(() => defaultVariant(product))
  const [focus, setFocus] = useState(null)
  const optionImages = product.optionImages ?? {}
  // Choosing an option shows its picture, also when it was already chosen; a new object re-focuses it.
  const chooseVariant = (next, name) => {
    const src = optionImages[name]?.[next[name]]
    setVariant(next)
    if (src) setFocus({ src })
  }
  // A gallery picture that belongs to an option selects that option.
  const pickFromGallery = (src) => {
    for (const [name, options] of Object.entries(optionImages)) {
      const option = Object.keys(options).find((o) => options[o] === src)
      if (option && product.variants?.some((v) => v.name === name && v.options.includes(option))) {
        setVariant((v) => ({ ...v, [name]: option }))
        return
      }
    }
  }
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openDrawer)
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const discount = discountPercent(product.price, product.oldPrice)
  const inStock = product.stock > 0
  const category = product.category

  const addToCart = () => {
    const inCart = useCartStore.getState().items.reduce((sum, i) => (i.productId === product.id ? sum + i.qty : sum), 0)
    if (inCart + qty > product.stock) {
      notify.error('Not enough stock', { description: `Only ${product.stock} left and ${inCart} already in your cart` })
      return
    }
    addItem(product.id, qty, variant)
    notify.success('Added to cart', {
      description: `${qty > 1 ? `${qty} × ` : ''}${product.name} · ${formatPrice(product.price * qty)}`,
      action: isDesktop ? { label: 'View cart', onClick: openCart } : { label: 'View', onClick: () => navigate('/cart') },
    })
  }
  const orderNow = () => {
    addItem(product.id, qty, variant)
    navigate('/checkout')
  }

  const crumbs = [{ label: 'Home', to: '/' }, { label: category.name, to: `/category/${category.slug}` }, { label: product.name }]

  return (
    <div className="pb-[calc(69px+env(safe-area-inset-bottom))] lg:bg-surface lg:pb-[72px]">
      <Breadcrumbs items={crumbs.slice(0, 2)} className="site-container pt-3 lg:hidden" />
      <Breadcrumbs items={crumbs} className="site-container hidden h-[52px] lg:flex" />

      <div className="lg:site-container">
        <section className="flex flex-col gap-0 lg:grid lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:rounded-2xl lg:bg-white lg:py-8 lg:pr-10 lg:pl-8 xl:grid-cols-[72px_500px_minmax(0,1fr)]">
          <div className="site-container pt-3 lg:contents">
            <Gallery product={product} discount={discount} focus={focus} onThumb={pickFromGallery} />
          </div>
          <div className="site-container pt-[18px] lg:w-auto lg:max-w-none lg:p-0">
            <BuyBox
              product={product}
              category={category}
              store={store}
              discount={discount}
              variant={variant}
              onVariant={chooseVariant}
              qty={qty}
              onQty={setQty}
              onAddToCart={addToCart}
              onOrderNow={orderNow}
            />
          </div>
        </section>

        <div className="lg:mt-6">
          <DetailsTabs product={product} reviews={reviews} store={store} />
        </div>
      </div>

      <ProductRow title="Related Products" products={related} seeAllTo={`/category/${category.slug}`} seeAllLabel={category.name} />

      {/* Sits directly above the 68px bottom nav (Figma 30:3938). */}
      <div className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 flex gap-2.5 border-t border-nav-line bg-white px-4 py-2.5 lg:hidden">
        <button
          type="button"
          disabled={!inStock}
          onClick={addToCart}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-text text-[13px] font-bold text-text disabled:opacity-40"
        >
          <ShoppingCart size={17} />
          Add to Cart
        </button>
        <button type="button" disabled={!inStock} onClick={orderNow} className="bg-brand-gradient h-12 flex-1 rounded-[10px] text-[14px] font-bold text-white disabled:opacity-40">
          {inStock ? 'Order Now' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}

export default function Product() {
  const { slug } = useParams()
  const productQuery = useProduct(slug)
  const settings = useSettings()
  const related = useRelatedProducts(slug)
  const reviews = useReviews(productQuery.data?.id)
  const product = productQuery.data
  const ready = product === null || (product && settings.data && reviews.data && related.data)
  const status = combine(productQuery, settings, related, reviews)
  usePageTitle(ready ? (product?.name ?? 'Page not found') : null)

  // Each slug is its own query, so the skeleton also shows while moving between products.
  if (!ready && status.isError) return <ErrorState onRetry={status.refetch} />
  if (!ready) return <ProductDetailsSkeleton />
  if (!product) return <NotFound />
  return <ProductDetails key={slug} product={product} store={settings.data} reviews={reviews.data} related={related.data} />
}
