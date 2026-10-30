import { Heart, Star, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFavoriteToggle } from '../hooks/useFavoriteToggle.js'
import { useOrderNow } from '../hooks/useOrderNow.js'
import { cn } from '../lib/cn.js'
import { discountPercent, formatPrice, formatSold, shouldShowRating } from '../lib/format.js'

// Figma "Product Card" (8:233): 140px image below lg, 215px from lg.
// The whole card links to the product; favorite and Order Now sit above the link.
// orderOnHover adds the desktop hover state from the Shop grid (27:3482).
export default function ProductCard({ product, className, orderOnHover = false }) {
  const [isFavorite, toggleFavorite] = useFavoriteToggle(product)
  const orderNow = useOrderNow()
  const discount = discountPercent(product.price, product.oldPrice)
  const href = `/product/${product.slug}`
  const canOrder = orderOnHover && product.stock > 0

  return (
    <div className={cn('group/card relative flex flex-col rounded-[10px] bg-white pb-1', canOrder && 'lg:hover:z-20', className)}>
      {canOrder && (
        <div
          aria-hidden="true"
          className="absolute -inset-x-2 -top-2 -bottom-[58px] hidden rounded-[14px] border-[1.5px] border-primary-soft bg-white shadow-[0_14px_15px_color-mix(in_srgb,var(--color-primary)_16%,transparent)] lg:group-hover/card:block"
        />
      )}
      <div className="relative h-[140px] overflow-hidden rounded-[10px] bg-fill lg:h-[215px]">
        <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="size-full object-contain mix-blend-multiply transition-transform duration-500 ease-out group-hover/card:scale-110" />
        {discount > 0 && (
          <span className="absolute top-2 right-2 rounded bg-secondary px-[7px] py-[3px] text-[11px] font-bold text-white">{discount}% OFF</span>
        )}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
          className={cn(
            'absolute top-2 left-2 z-10 flex size-[30px] items-center justify-center rounded-full border border-fill-line bg-white text-text',
            isFavorite && 'border-secondary bg-secondary text-white',
          )}
        >
          <Heart size={15} />
        </button>
        {product.freeDelivery && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-highlight py-1 pr-[9px] pl-2 text-[11px] font-bold text-text">
            <Truck size={13} />
            Free Delivery
          </span>
        )}
      </div>

      <div className="relative flex flex-col items-start gap-2 px-1 pt-2.5">
        <h3 className="line-clamp-2 h-9 font-body text-[13px] leading-[18px] font-semibold text-text group-hover/card:text-primary lg:h-10 lg:text-[14px] lg:leading-5">{product.name}</h3>
        <div className="h-4">
          {shouldShowRating(product) ? (
            <p className="flex items-center gap-1 text-body-sm whitespace-pre text-text-muted">
              <Star size={13} className="fill-highlight text-highlight" />
              {product.rating}
              {product.soldCount > 0 && `  ·  ${formatSold(product.soldCount)} sold`}
            </p>
          ) : (
            product.soldCount > 0 && <p className="text-body-sm text-text-muted">{formatSold(product.soldCount)} sold</p>
          )}
        </div>
        <p className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-[15px] font-bold text-text lg:text-[17px]">{formatPrice(product.price)}</span>
          {discount > 0 && <span className="text-[13px] text-text-faint line-through">{formatPrice(product.oldPrice)}</span>}
        </p>
      </div>
      <Link to={href} aria-label={product.name} className="absolute inset-0 z-[1] rounded-[10px]" />
      {canOrder && (
        <button
          type="button"
          onClick={() => orderNow(product)}
          className="absolute inset-x-1 -bottom-12 z-10 hidden h-10 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-white focus-visible:flex lg:group-hover/card:flex"
        >
          Order Now
        </button>
      )}
    </div>
  )
}
