import { CreditCard, MessageCircle, ShieldCheck, ShoppingCart, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { formatPrice, formatSold, shouldShowRating } from '../../lib/format.js'
import { whatsappOrderUrl } from '../../lib/product.js'
import Stars from './Stars.jsx'

function QuantityStepper({ value, max, onChange }) {
  const btn = 'flex h-full w-10 items-center justify-center text-[15px] font-semibold text-text disabled:text-text-faint lg:w-[42px] lg:text-[18px]'
  return (
    <div className="flex h-[38px] items-center rounded-lg border border-border-strong lg:h-10">
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)} className={btn}>
        −
      </button>
      <span aria-live="polite" className="flex h-full w-10 items-center justify-center border-x border-border-strong text-[15px] font-semibold text-text lg:w-[42px]">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </div>
  )
}

// Right column of the desktop product card (28:3368) and the mobile info block (30:3670).
export default function BuyBox({ product, category, store, discount, variant, onVariant, qty, onQty, onAddToCart, onOrderNow }) {
  const inStock = product.stock > 0
  const saved = product.oldPrice ? product.oldPrice - product.price : 0
  const replacement = product.specs.find((s) => s.label === 'Warranty')?.value ?? '7 days replacement'

  const perks = [
    { Icon: CreditCard, title: 'Cash on Delivery', sub: 'Pay when you get it', mobileSub: 'Pay on receive' },
    product.freeDelivery
      ? { Icon: Truck, title: 'Free Delivery', sub: 'For this product' }
      : { Icon: Truck, title: 'Fast Delivery', sub: 'All over Bangladesh' },
    { Icon: ShieldCheck, title: '7 Days Replacement', mobileTitle: 'Replacement', sub: 'For manufacturing faults', mobileSub: '7 days', hide: !inStock && replacement === 'No warranty' },
  ]

  return (
    <div className="flex min-w-0 flex-col items-start gap-3 lg:gap-4">
      {category && (
        <Link to={`/category/${category.slug}`} className="rounded-xl bg-primary-tint px-[9px] py-1 text-[11px] font-semibold text-primary-deep lg:px-2.5 lg:py-[5px] lg:text-body-sm lg:font-semibold">
          {category.name}
        </Link>
      )}
      <h1 className="font-heading text-[21px] leading-[27px] font-bold tracking-[-0.315px] text-text lg:text-h2 lg:leading-normal lg:tracking-normal">{product.name}</h1>

      {shouldShowRating(product) ? (
        <p className="flex items-center gap-1 whitespace-pre">
          <Stars rating={product.rating} />
          <span className="text-[13px] font-bold text-text lg:text-body lg:font-bold"> {product.rating}</span>
          <span className="text-body-sm text-text-muted lg:text-[13px]">
            <span className="lg:hidden">  ({product.reviewCount})</span>
            <span className="hidden lg:inline">  ({product.reviewCount} reviews)</span>
            {product.soldCount > 0 && `  •  ${formatSold(product.soldCount)} sold`}
          </span>
        </p>
      ) : product.isNew ? (
        <span className="rounded-md bg-secondary-tint px-[7px] py-0.5 text-[11px] font-semibold text-secondary">New arrival</span>
      ) : product.soldCount > 0 ? (
        <p className="text-body-sm text-text-muted lg:text-[13px]">{formatSold(product.soldCount)} sold</p>
      ) : null}

      <p className="flex flex-wrap items-center gap-2.5 lg:gap-3">
        <span className="text-[26px] font-extrabold tracking-[-0.26px] text-text lg:text-[32px] lg:tracking-[-0.32px]">{formatPrice(product.price)}</span>
        {discount > 0 && (
          <>
            <span className="text-[15px] text-text-faint line-through lg:text-[18px]">{formatPrice(product.oldPrice)}</span>
            <span className="rounded-md bg-secondary-tint px-[7px] py-[3px] text-[11px] font-bold whitespace-pre text-primary-deep lg:px-2 lg:py-1 lg:text-body-sm lg:font-bold">
              -{discount}%<span className="hidden lg:inline">{`  Save ${formatPrice(saved)}`}</span>
            </span>
          </>
        )}
      </p>

      {product.freeDelivery && (
        <div className="flex w-full items-center gap-3 rounded-[10px] border border-highlight-line bg-highlight-tint px-3 py-2.5 lg:px-3.5 lg:py-3">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-highlight text-text lg:size-[38px]">
            <Truck className="size-[17px] lg:size-[19px]" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-bold text-text lg:text-body lg:font-bold">Free Delivery on this product</span>
            <span className="text-[11.5px] text-text-muted lg:text-[12.5px]">No delivery charge anywhere in Bangladesh</span>
          </span>
        </div>
      )}

      <hr className="hidden w-full border-border lg:block" />
      <div className="flex flex-wrap gap-4 lg:flex-col lg:gap-2">
        <p className="flex items-center gap-1.5 text-[13px] lg:gap-2 lg:text-body">
          <span className={cn('size-2 rounded-full', inStock ? 'bg-stock' : 'bg-error')} />
          <span className="hidden text-text-muted lg:inline">Availability:</span>
          <span className={cn('font-bold', inStock ? 'text-stock-ink' : 'text-error')}>{inStock ? 'In Stock' : 'Out of Stock'}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[13px] lg:gap-2 lg:text-body">
          <span className="hidden size-2 rounded-full bg-text lg:inline-block" />
          <span className="text-text-muted">Brand:</span>
          <span className="font-bold text-text">{product.brand}</span>
        </p>
      </div>
      <p className="text-[13px] leading-5 text-text-secondary lg:text-body lg:leading-normal">{product.shortDescription}</p>
      <hr className="hidden w-full border-border lg:block" />

      {product.variants.map((group) => (
        <fieldset key={group.name} className="flex flex-col gap-2 lg:gap-2.5">
          <legend className="mb-2 text-[13px] font-bold text-text lg:mb-2.5 lg:text-body lg:font-bold">{group.name}</legend>
          <div className="flex flex-wrap gap-2 lg:gap-2.5">
            {group.options.map((option) => {
              const selected = variant[group.name] === option
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onVariant({ ...variant, [group.name]: option })}
                  className={cn(
                    'rounded-lg px-3.5 py-2 text-[13px] lg:px-4 lg:py-[9px]',
                    selected ? 'border-[1.5px] border-text font-semibold text-text' : 'border border-border-strong font-medium text-text-muted hover:border-text',
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-3 lg:gap-3.5">
        <span className="text-[13px] font-bold text-text lg:text-body lg:font-bold">Quantity</span>
        <QuantityStepper value={qty} max={Math.max(1, product.stock)} onChange={onQty} />
      </div>

      <div className="hidden w-full gap-3 lg:flex">
        <button
          type="button"
          disabled={!inStock}
          onClick={onAddToCart}
          className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-text text-body font-bold tracking-[0.56px] text-text disabled:opacity-40"
        >
          <ShoppingCart size={19} />
          ADD TO CART
        </button>
        <button type="button" disabled={!inStock} onClick={onOrderNow} className="bg-brand-gradient h-[52px] flex-1 rounded-[10px] text-[15px] font-bold text-white disabled:opacity-40">
          {inStock ? 'Order Now' : 'Out of Stock'}
        </button>
      </div>

      <a
        href={whatsappOrderUrl(store?.whatsapp, product)}
        target="_blank"
        rel="noreferrer"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-whatsapp text-[13px] font-bold text-whatsapp-ink lg:h-12 lg:text-body lg:font-bold"
      >
        <MessageCircle className="size-[17px] lg:size-[18px]" />
        WhatsApp to Order
      </a>

      <ul className="flex w-full rounded-[10px] border border-border py-3 lg:py-3.5">
        {perks
          .filter((p) => !p.hide)
          .map(({ Icon, title, mobileTitle, sub, mobileSub }) => (
            <li key={title} className="flex min-w-0 flex-1 flex-col items-center gap-[3px] border-border px-1 text-center not-first:border-l lg:gap-1">
              <Icon className="size-[18px] text-text lg:size-5" />
              <span className="text-[11px] font-bold text-text lg:text-[13px]">
                <span className="lg:hidden">{mobileTitle ?? title}</span>
                <span className="hidden lg:inline">{title}</span>
              </span>
              <span className="text-[10px] text-text-muted lg:text-[11px]">
                <span className="lg:hidden">{mobileSub ?? sub}</span>
                <span className="hidden lg:inline">{sub}</span>
              </span>
            </li>
          ))}
      </ul>

      {category && (
        <p className="hidden gap-1.5 text-[13px] lg:flex">
          <span className="text-text-muted">Category:</span>
          <Link to={`/category/${category.slug}`} className="font-semibold text-primary">
            {category.name}
          </Link>
        </p>
      )}
    </div>
  )
}
