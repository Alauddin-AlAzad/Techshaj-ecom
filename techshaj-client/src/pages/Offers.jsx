import { BadgePercent, ChevronDown, Zap } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'
import { getOffers, getProducts } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { useCountdown } from '../hooks/useCountdown.js'
import { copyText } from '../lib/clipboard.js'
import { cn } from '../lib/cn.js'
import { discountPercent, formatPrice } from '../lib/format.js'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'flash-sale', label: 'Flash Sale' },
  { value: 'free-delivery', label: 'Free Delivery' },
  { value: 'combo', label: 'Combo' },
  { value: 'clearance', label: 'Clearance' },
]

const SORTS = [
  { value: 'discount', label: 'Biggest discount' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

const discountOf = (p) => discountPercent(p.price, p.oldPrice)

// Every discounted or free-delivery product is an offer.
const isOffer = (p) => discountOf(p) > 0 || p.freeDelivery

function matchesTab(product, tab) {
  if (tab === 'all') return true
  if (tab === 'free-delivery') return product.freeDelivery
  return product.collections.includes(tab)
}

function sortOffers(list, sort) {
  const sorted = [...list]
  if (sort === 'price-asc') return sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return sorted.sort((a, b) => b.price - a.price)
  return sorted.sort((a, b) => discountOf(b) - discountOf(a))
}

async function loadOffers() {
  const [offers, products] = await Promise.all([getOffers(), getProducts()])
  return { ...offers, products }
}

function CouponCard({ coupon }) {
  const value = coupon.type === 'percent' ? `${coupon.value}%` : formatPrice(coupon.value)
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-highlight bg-highlight-tint px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-highlight text-text">
        <BadgePercent size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-bold text-text">Use code {coupon.code}</span>
        <span className="text-body-sm text-text-muted">
          {value} OFF{coupon.minOrder ? ` on orders over ${formatPrice(coupon.minOrder)}` : ''}
        </span>
      </span>
      <button type="button" onClick={() => copyText(coupon.code, 'Coupon code copied')} className="h-8 shrink-0 rounded-lg bg-text px-3 text-label-sm text-white">
        Copy
      </button>
    </div>
  )
}

function FlashSaleBar({ title, endsAt }) {
  const t = useCountdown(endsAt)
  // Three boxes as in Figma; with more than a day left they show days, hours and minutes.
  const units = Number(t.days) > 0 ? [`${Number(t.days)}d`, t.hours, t.mins] : [t.hours, t.mins, t.secs]

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] bg-flash-bar px-3.5 py-3">
      <span className="flex items-center gap-2">
        <Zap size={18} className="text-highlight" />
        <span className="flex flex-col gap-px">
          <span className="font-heading text-[15px] font-bold text-white">{title}</span>
          <span className="text-[11px] text-flash-sub">{t.ended ? 'Ended' : 'Ends in'}</span>
        </span>
      </span>
      <span role="timer" aria-label="Time left in flash sale" className="flex items-center gap-1 text-body font-bold text-white tabular-nums">
        {units.map((u, i) => (
          <Fragment key={i}>
            {i > 0 && <span>:</span>}
            <span className="flex h-[30px] min-w-8 items-center justify-center rounded-md bg-primary px-1">{u}</span>
          </Fragment>
        ))}
      </span>
    </div>
  )
}

// Figma "Offers – Mobile 390" (95:18258). Desktop reuses the sections with the 5-column Shop grid.
export default function Offers() {
  const data = useAsync(loadOffers)
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'all'
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'discount'

  const offers = useMemo(() => (data ? data.products.filter(isOffer) : []), [data])
  const results = useMemo(() => sortOffers(offers.filter((p) => matchesTab(p, tab)), sort), [offers, tab, sort])
  const maxDiscount = Math.max(0, ...offers.map(discountOf))

  const update = (key, value, fallback) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === fallback) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  return (
    <div className="site-container flex flex-col gap-[18px] pt-4 pb-24 lg:gap-6 lg:pt-8 lg:pb-[72px]">
      <section className="bg-offers-gradient flex flex-col gap-1.5 rounded-2xl px-[18px] py-5 lg:gap-2 lg:px-10 lg:py-9">
        <p className="text-[11px] font-bold text-menu-eyebrow lg:text-label-sm">THIS WEEK</p>
        <h1 className="text-[24px] font-bold text-white lg:text-[36px]">Offers &amp; Deals</h1>
        {maxDiscount > 0 && <p className="text-[13px] text-offers-copy lg:text-body-lg">Up to {maxDiscount}% OFF on gadgets you love</p>}
      </section>

      <div role="tablist" aria-label="Offer type" className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => update('tab', t.value, 'all')}
            className={cn(
              'h-[34px] shrink-0 rounded-[17px] border px-3.5 text-[12.5px] font-semibold',
              tab === t.value ? 'border-text bg-text text-white' : 'border-border-strong bg-white text-text-secondary hover:border-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data && (
        <div className="grid gap-[18px] lg:grid-cols-2 lg:gap-4">
          {data.coupons.map((c) => (
            <CouponCard key={c.code} coupon={c} />
          ))}
          {data.flashSale && <FlashSaleBar title={data.flashSale.title} endsAt={data.flashSale.endsAt} />}
        </div>
      )}

      <section className="flex flex-col gap-3.5 lg:gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-text lg:text-[26px] lg:tracking-[-0.39px]">
            Biggest <span className="text-primary">Discounts</span>
          </h2>
          <label className="relative flex items-center gap-0.5 text-[12.5px] font-semibold text-text-secondary lg:text-label">
            Sort
            <ChevronDown size={14} />
            <select
              aria-label="Sort offers"
              value={sort}
              onChange={(e) => update('sort', e.target.value, 'discount')}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!data ? (
          <div className="min-h-[40vh]" />
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-body text-text-muted">No offers in this category right now. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-[22px] xl:grid-cols-5">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} orderOnHover />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
