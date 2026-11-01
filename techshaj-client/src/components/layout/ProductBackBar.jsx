import { ArrowLeft, Share2, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { selectCartCount, useCartStore } from '../../context/useCartStore.js'
import { useProduct } from '../../hooks/useProduct.js'
import ShareSheet from '../product/ShareSheet.jsx'

export default function ProductBackBar() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { data: product } = useProduct(slug)
  const cartCount = useCartStore(selectCartCount)
  const openCart = useCartStore((s) => s.openDrawer)
  const [sharing, setSharing] = useState(false)
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))
  const iconBtn = 'relative flex size-10 shrink-0 items-center justify-center rounded-full text-text hover:text-primary'

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-white lg:hidden">
      <div className="site-container flex h-14 items-center gap-1">
        <button type="button" onClick={back} aria-label="Go back" className={`${iconBtn} -ml-2`}>
          <ArrowLeft size={22} />
        </button>
        <p className="min-w-0 flex-1 truncate text-label font-semibold text-text">{product?.name}</p>
        {product && (
          <button type="button" onClick={() => setSharing(true)} aria-label="Share" className={iconBtn}>
            <Share2 size={20} />
          </button>
        )}
        <button type="button" onClick={openCart} aria-label={`Cart, ${cartCount} items`} className={`${iconBtn} -mr-2`}>
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="absolute top-1 right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-white">{cartCount}</span>}
        </button>
      </div>
      {sharing && product && <ShareSheet product={product} onClose={() => setSharing(false)} />}
    </div>
  )
}
