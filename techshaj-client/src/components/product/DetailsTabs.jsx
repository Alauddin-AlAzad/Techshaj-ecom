import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.js'
import { formatPrice, shouldShowRating } from '../../lib/format.js'
import Stars from './Stars.jsx'

function Bullets({ items }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2 text-[13px] text-text-secondary lg:gap-2.5 lg:text-body">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function SpecTable({ specs }) {
  return (
    <dl className="overflow-hidden rounded-[10px] border border-border text-[13px]">
      {specs.map((s) => (
        <div key={s.label} className="flex px-4 py-3 odd:bg-fill-soft even:bg-white">
          <dt className="w-[130px] shrink-0 font-semibold text-text-muted">{s.label}</dt>
          <dd className="font-medium text-text">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Reviews({ product, reviews }) {
  if (!shouldShowRating(product) || !reviews.length) {
    return <p className="text-body text-text-muted">No reviews yet. Bought this product? Your review will help other customers.</p>
  }
  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2">
        <span className="text-[28px] font-extrabold text-text">{product.rating}</span>
        <Stars rating={product.rating} />
        <span className="text-[13px] text-text-muted">based on {product.reviewCount} reviews</span>
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col gap-1.5 py-4 first:pt-0">
            <div className="flex items-center gap-2">
              <Stars rating={r.rating} />
              <span className="text-label text-text">{r.title}</span>
            </div>
            <p className="text-body text-text-secondary">{r.text}</p>
            <p className="text-body-sm text-text-faint">
              {r.name} · {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeliveryReturn({ store, product }) {
  return (
    <div className="flex flex-col gap-4 text-[13px] text-text-secondary lg:text-body">
      <ul className="overflow-hidden rounded-[10px] border border-border">
        {store?.shipping.zones.map((z) => (
          <li key={z.id} className="flex items-center justify-between gap-3 px-4 py-3 odd:bg-fill-soft">
            <span className="font-semibold text-text">{z.name}</span>
            <span>{z.days}</span>
            <span className="font-bold text-text">{product.freeDelivery ? 'Free' : formatPrice(z.charge)}</span>
          </li>
        ))}
      </ul>
      <Bullets
        items={[
          product.freeDelivery ? 'Free delivery on this product anywhere in Bangladesh.' : `Free delivery on orders over ${formatPrice(store?.freeShippingThreshold ?? 0)}.`,
          'Cash on Delivery available all over Bangladesh. Check the product before you pay.',
          '7 days replacement for manufacturing faults. Keep the box and accessories.',
        ]}
      />
    </div>
  )
}

// Desktop: tabs (28:3456). Mobile: accordion with Description open (30:3742).
export default function DetailsTabs({ product, reviews, store }) {
  const [tab, setTab] = useState('description')
  const [open, setOpen] = useState({ description: true })
  const features = product.specs.filter((s) => !['Brand', 'Warranty'].includes(s.label)).map((s) => `${s.label}: ${s.value}`)

  const sections = [
    {
      id: 'description',
      label: 'Description',
      content: (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h3 className="hidden font-body text-price lg:block">Key Features</h3>
            <Bullets items={features} />
            <p className="text-[13px] leading-5 text-text-secondary lg:text-body lg:leading-normal">{product.description}</p>
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <SpecTable specs={product.specs} />
          </div>
        </div>
      ),
    },
    { id: 'specs', label: 'Specifications', content: <SpecTable specs={product.specs} /> },
    {
      id: 'reviews',
      label: shouldShowRating(product) ? `Reviews (${product.reviewCount})` : 'Reviews',
      content: <Reviews product={product} reviews={reviews} />,
    },
    { id: 'delivery', label: 'Delivery & Return', content: <DeliveryReturn store={store} product={product} /> },
  ]

  return (
    <>
      <section className="hidden rounded-2xl bg-white px-10 pb-8 lg:block">
        <div role="tablist" className="mb-6 flex gap-8 border-b border-border">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={tab === s.id}
              aria-controls={`panel-${s.id}`}
              onClick={() => setTab(s.id)}
              className={cn('-mb-px border-b-3 pt-5 pb-3.5 text-[15px]', tab === s.id ? 'border-primary font-bold text-text' : 'border-transparent font-medium text-text-muted hover:text-text')}
            >
              {s.label}
            </button>
          ))}
        </div>
        {sections.map((s) => (
          <div key={s.id} role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`tab-${s.id}`} hidden={tab !== s.id}>
            {s.content}
          </div>
        ))}
      </section>

      <section className="site-container pt-5 lg:hidden">
        {sections.map((s) => {
          const isOpen = !!open[s.id]
          return (
            <div key={s.id} className="border-b border-border first:border-t">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen({ ...open, [s.id]: !isOpen })}
                className={cn('flex w-full items-center justify-between py-3.5 text-[15px] text-text', isOpen ? 'font-bold' : 'font-semibold')}
              >
                {s.label}
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {isOpen && <div className="pb-3.5">{s.content}</div>}
            </div>
          )
        })}
      </section>
    </>
  )
}
