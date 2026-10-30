import { ArrowRight, Check, Copy, PackageSearch, Phone } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { useOrderStore } from '../context/useOrderStore.js'
import { getStore } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { copyText } from '../lib/clipboard.js'
import { formatPrice } from '../lib/format.js'
import { itemCount, PAYMENT_LABELS } from '../lib/order.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

// Figma "Order Success" desktop (34:3320) and mobile (34:3718).
export default function OrderSuccess() {
  usePageTitle('Order Placed')
  const order = useOrderStore((s) => s.orders.find((o) => o.id === s.lastOrderId))
  const store = useAsync(getStore)

  if (!order) return <Navigate to="/" replace />

  const count = itemCount(order)
  const details = [
    { label: 'Items', value: `${count} ${count === 1 ? 'item' : 'items'}  •  ${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}` },
    { label: 'Delivery to', value: order.address },
    { label: 'Payment', value: PAYMENT_LABELS[order.paymentMethod] },
    { label: 'Total payable', value: order.paymentMethod === 'cod' ? formatPrice(order.total) : `${formatPrice(order.total)} (paid)`, strong: true },
  ]

  return (
    <div className="bg-surface px-4 pt-[18px] pb-24 lg:px-0 lg:pt-14 lg:pb-[72px]">
      <div className="mx-auto flex max-w-[620px] flex-col items-center gap-3.5 rounded-2xl bg-white px-[18px] pt-7 pb-[22px] text-center lg:gap-[18px] lg:px-12 lg:pt-10 lg:pb-9">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-white lg:size-[76px]">
          <Check className="size-8 lg:size-[38px]" strokeWidth={2.5} />
        </span>
        <h1 className="font-bangla text-[20px] font-bold text-text lg:text-[26px]">ধন্যবাদ! আপনার অর্ডারটি সফল হয়েছে</h1>
        <p className="font-bangla text-body leading-5 text-text-muted lg:text-[15px] lg:leading-6">আমাদের একজন প্রতিনিধি শিগগিরই আপনাকে কল করে অর্ডার কনফার্ম করবেন।</p>

        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-nav-line bg-fill-soft px-4 py-3.5 text-left">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-body-sm text-text-muted">Order ID</span>
            <span className="font-heading text-[20px] font-bold tracking-[-0.3px] text-text lg:text-[24px] lg:tracking-[-0.36px]">{order.id}</span>
          </div>
          <button
            type="button"
            onClick={() => copyText(order.id, 'Order ID copied')}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong bg-white px-3 py-2 text-label-sm text-text"
          >
            <Copy size={15} />
            Copy
          </button>
        </div>

        <dl className="flex w-full flex-col gap-2.5 py-1 text-[13px]">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between gap-4">
              <dt className="shrink-0 text-text-muted">{d.label}</dt>
              <dd className={d.strong ? 'font-extrabold text-text' : 'min-w-0 truncate font-semibold whitespace-pre text-text'}>{d.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex w-full flex-col gap-2.5 lg:flex-row">
          <Link
            to={`/track-order?id=${order.id}&phone=${order.phone}`}
            className="flex h-12 items-center justify-center gap-2 rounded-[10px] lg:flex-1 border-[1.5px] border-text text-body font-bold text-text"
          >
            <PackageSearch size={18} />
            Track Order
          </Link>
          <Link to="/shop" className="flex h-12 items-center justify-center gap-2 rounded-[10px] lg:flex-1 bg-primary text-body font-bold text-white">
            Continue Shopping
            <ArrowRight size={17} />
          </Link>
        </div>

        {store && (
          <a href={`tel:${store.hotline}`} className="flex items-center gap-1.5 text-body-sm text-text-muted">
            <Phone size={14} />
            Need help? Call {store.hotline}
          </a>
        )}
      </div>
    </div>
  )
}
