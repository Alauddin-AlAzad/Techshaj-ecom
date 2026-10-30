import 'swiper/css'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ProductRow from '../components/home/ProductRow.jsx'
import BuyBox from '../components/product/BuyBox.jsx'
import DetailsTabs from '../components/product/DetailsTabs.jsx'
import Gallery from '../components/product/Gallery.jsx'
import { useCartStore } from '../context/useCartStore.js'
import { getProductBySlug, getProducts, getReviews, getStore } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { discountPercent } from '../lib/format.js'
import { defaultVariant } from '../lib/product.js'
import NotFound from './NotFound.jsx'

async function loadProduct(slug) {
  const product = await getProductBySlug(slug)
  if (!product) return { product: null }
  const [store, reviews, sameCategory, sameParent] = await Promise.all([
    getStore(),
    getReviews(product.id),
    getProducts({ category: product.category.slug }),
    product.parentCategory ? getProducts({ category: product.parentCategory.slug }) : [],
  ])
  // Same category first, then the rest of the department, up to 10.
  const related = [...sameCategory, ...sameParent].filter((p, i, all) => p.id !== product.id && all.findIndex((x) => x.id === p.id) === i).slice(0, 10)
  return { product, store, reviews, related }
}

// Keyed by slug from the route so state resets when moving between products.
function ProductDetails({ product, store, reviews, related }) {
  const [variant, setVariant] = useState(() => defaultVariant(product))
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()
  const discount = discountPercent(product.price, product.oldPrice)
  const inStock = product.stock > 0
  const category = product.category

  const addToCart = () => {
    addItem(product.id, qty, variant)
    toast.success('Added to cart', {
      description: `${qty} × ${product.name}`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
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
            <Gallery product={product} discount={discount} />
          </div>
          <div className="site-container pt-[18px] lg:w-auto lg:max-w-none lg:p-0">
            <BuyBox
              product={product}
              category={category}
              store={store}
              discount={discount}
              variant={variant}
              onVariant={setVariant}
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
  const data = useAsync(() => loadProduct(slug), [slug])

  if (!data) return <div className="min-h-[60vh]" />
  if (!data.product || data.product.slug !== slug) return data.product ? <div className="min-h-[60vh]" /> : <NotFound />
  return <ProductDetails key={slug} {...data} />
}
