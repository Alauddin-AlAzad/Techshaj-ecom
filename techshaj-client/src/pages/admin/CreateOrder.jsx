import { ChevronLeft, ImageOff, Minus, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import Card from '../../components/admin/Card.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { PAYMENT_LABELS } from '../../components/admin/orderMeta.js'
import { useCreateOrder } from '../../hooks/useAdminOrders.js'
import { useAdminProductSearch } from '../../hooks/useAdminProducts.js'
import { useAdminSettings } from '../../hooks/useAdminSettings.js'
import { formatPrice } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'

const digits = (value) => value.replace(/\D/g, '')
const amount = (value) => (value === '' ? 0 : Number(value))

function ProductPicker({ onPick }) {
  const [search, setSearch] = useState('')
  const { data: results = [], isFetching } = useAdminProductSearch(search, 6)
  return (
    <div className="relative">
      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a product by name or code" className={cn(inputClass(), 'pl-9')} aria-label="Search products" />
      </label>
      {search.trim() && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-menu">
          {results.length === 0 && <li className="px-3 py-2.5 text-body-sm text-text-muted">{isFetching ? 'Searching…' : 'No products found'}</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(p)
                  setSearch('')
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-fill-soft"
              >
                {p.images?.[0] ? <img src={p.images[0]} alt="" className="size-10 shrink-0 rounded-md object-cover" /> : <ImageOff size={18} className="shrink-0 text-text-faint" />}
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-body font-semibold text-text">{p.name}</span>
                  <span className="text-body-sm text-text-muted">
                    {p.code} · {formatPrice(p.price)} · {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function CreateOrder() {
  const navigate = useNavigate()
  const settings = useAdminSettings()
  const create = useCreateOrder()
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', note: '' })
  const [lines, setLines] = useState([])
  const [zoneId, setZoneId] = useState('')
  const [shipping, setShipping] = useState(null)
  const [discount, setDiscount] = useState('')
  const [payment, setPayment] = useState('cod')
  const [transactionId, setTransactionId] = useState('')
  const [status, setStatus] = useState('confirmed')

  if (settings.isLoading) return <Skeleton className="h-[480px] rounded-xl" />
  if (settings.isError) return <ErrorState title="Could not load delivery zones" onRetry={settings.refetch} />

  const zones = settings.data.shippingZones ?? []
  const zone = zones.find((z) => z.id === zoneId) ?? zones[0]
  const shippingValue = shipping ?? String(zone?.charge ?? 0)
  const subtotal = lines.reduce((sum, l) => sum + amount(l.price) * l.quantity, 0)
  const total = subtotal + amount(shippingValue) - amount(discount)

  const addProduct = (p) =>
    setLines((list) => [...list, { key: `${p.id}-${Date.now()}`, product: p, price: String(p.price), quantity: 1, variant: Object.fromEntries((p.variants ?? []).map((v) => [v.name, v.options[0]])) }])
  const setLine = (key, next) => setLines((list) => list.map((l) => (l.key === key ? { ...l, ...next } : l)))

  const problem = (() => {
    if (!lines.length) return 'Add at least one product'
    if (!customer.name.trim()) return 'Enter the customer name'
    if (!/^01[3-9]\d{8}$/.test(customer.phone)) return 'Phone must be 11 digits, like 01XXXXXXXXX'
    if (!customer.address.trim()) return 'Enter the delivery address'
    if (!zone) return 'Add a delivery zone in Settings first'
    if (total < 0) return 'Discount cannot be more than the order amount'
    return null
  })()

  const submit = () =>
    create.mutate(
      {
        customer: { ...customer, name: customer.name.trim(), address: customer.address.trim(), note: customer.note.trim() },
        zoneId: zone.id,
        paymentMethod: payment,
        transactionId: payment === 'cod' ? '' : transactionId.trim(),
        items: lines.map((l) => ({ productId: l.product.id, variant: l.variant, quantity: l.quantity, price: amount(l.price) })),
        shipping: amount(shippingValue),
        discount: amount(discount),
        status,
      },
      {
        onSuccess: (order) => {
          notify.success('Order created', { description: `#${order.orderId}` })
          navigate(`/admin/orders/${order.orderId}`)
        },
        onError: (error) => notify.error('Could not create the order', { description: errorMessage(error) }),
      },
    )

  const field = (key, label, props = {}) => (
    <FormField label={label} htmlFor={`new-${key}`}>
      <input id={`new-${key}`} value={customer[key]} onChange={(e) => setCustomer((c) => ({ ...c, [key]: key === 'phone' ? digits(e.target.value).slice(0, 11) : e.target.value }))} className={inputClass()} {...props} />
    </FormField>
  )

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-0">
      <div className="flex flex-col gap-1">
        <Link to="/admin/orders" className="flex items-center gap-1 self-start text-body-sm font-semibold text-text-muted hover:text-text">
          <ChevronLeft size={16} /> Orders
        </Link>
        <h1 className="text-[20px] font-bold text-text">New order</h1>
        <p className="text-[13px] text-text-muted">For orders taken by phone, Messenger or in person. Stock is reserved when you create it.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-5">
          <Card title="Products">
            <div className="flex flex-col gap-3">
              <ProductPicker onPick={addProduct} />
              {lines.length > 0 && (
                <ul className="flex flex-col divide-y divide-row-line rounded-xl border border-border">
                  {lines.map((l) => (
                    <li key={l.key} className="flex flex-col gap-3 p-3">
                      <div className="flex items-start gap-3">
                        {l.product.images?.[0] && <img src={l.product.images[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-body font-semibold text-text">{l.product.name}</p>
                          <p className="text-body-sm text-text-muted">{l.product.stock} in stock</p>
                        </div>
                        <button type="button" aria-label={`Remove ${l.product.name}`} onClick={() => setLines((list) => list.filter((x) => x.key !== l.key))} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-error-tint hover:text-error">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {(l.product.variants ?? []).map((v) => (
                          <select key={v.name} aria-label={v.name} value={l.variant[v.name]} onChange={(e) => setLine(l.key, { variant: { ...l.variant, [v.name]: e.target.value } })} className={cn(inputClass(), 'h-10 w-auto')}>
                            {v.options.map((o) => (
                              <option key={o} value={o}>
                                {v.name}: {o}
                              </option>
                            ))}
                          </select>
                        ))}
                        <label className="flex items-center gap-1.5 text-body-sm text-text-muted">
                          ৳
                          <input aria-label={`Price of ${l.product.name}`} inputMode="numeric" value={l.price} onChange={(e) => setLine(l.key, { price: digits(e.target.value) })} className={cn(inputClass(), 'h-10 w-24 text-right')} />
                        </label>
                        <div className="flex h-10 items-center rounded-lg border border-border-strong">
                          <button type="button" aria-label="Decrease quantity" onClick={() => setLine(l.key, { quantity: Math.max(l.quantity - 1, 1) })} className="flex size-10 items-center justify-center text-text-muted hover:text-text">
                            <Minus size={15} />
                          </button>
                          <span className="w-7 text-center text-body font-semibold text-text">{l.quantity}</span>
                          <button type="button" aria-label="Increase quantity" onClick={() => setLine(l.key, { quantity: Math.min(l.quantity + 1, 99) })} className="flex size-10 items-center justify-center text-text-muted hover:text-text">
                            <Plus size={15} />
                          </button>
                        </div>
                        <span className="ml-auto text-body font-bold text-text">{formatPrice(amount(l.price) * l.quantity)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card title="Customer">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {field('phone', 'Phone', { inputMode: 'numeric', placeholder: '01XXXXXXXXX' })}
                {field('name', 'Name', { maxLength: 80 })}
              </div>
              <FormField label="Address" htmlFor="new-address">
                <textarea id="new-address" rows={2} maxLength={300} value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} className={cn(inputClass(), 'h-auto resize-none py-3')} />
              </FormField>
              {field('note', 'Note (optional)', { maxLength: 300 })}
            </div>
          </Card>
        </div>

        <Card title="Delivery and payment">
          <div className="flex flex-col gap-4">
            <FormField label="Delivery zone" htmlFor="new-zone">
              <select
                id="new-zone"
                value={zone?.id ?? ''}
                onChange={(e) => {
                  setZoneId(e.target.value)
                  setShipping(null)
                }}
                className={inputClass()}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({formatPrice(z.charge)})
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Delivery charge" htmlFor="new-shipping">
                <input id="new-shipping" inputMode="numeric" value={shippingValue} onChange={(e) => setShipping(digits(e.target.value))} className={inputClass()} />
              </FormField>
              <FormField label="Discount" htmlFor="new-discount">
                <input id="new-discount" inputMode="numeric" placeholder="0" value={discount} onChange={(e) => setDiscount(digits(e.target.value))} className={inputClass()} />
              </FormField>
            </div>
            <FormField label="Payment" htmlFor="new-payment">
              <select id="new-payment" value={payment} onChange={(e) => setPayment(e.target.value)} className={inputClass()}>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            {payment !== 'cod' && (
              <FormField label="Transaction ID (optional)" htmlFor="new-trx">
                <input id="new-trx" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className={inputClass()} />
              </FormField>
            )}
            <FormField label="Status" htmlFor="new-status">
              <select id="new-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass()}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </FormField>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-body">
              <p className="flex justify-between text-text-muted">
                Subtotal <span className="text-text">{formatPrice(subtotal)}</span>
              </p>
              <p className="flex justify-between text-text-muted">
                Delivery <span className="text-text">{formatPrice(amount(shippingValue))}</span>
              </p>
              {amount(discount) > 0 && (
                <p className="flex justify-between text-text-muted">
                  Discount <span className="text-success">−{formatPrice(amount(discount))}</span>
                </p>
              )}
              <p className="flex justify-between pt-1 text-[16px] font-bold text-text">
                Total <span>{formatPrice(Math.max(total, 0))}</span>
              </p>
            </div>
            {problem && <p className="text-body-sm text-text-muted">{problem}</p>}
            <Button onClick={submit} loading={create.isPending} disabled={Boolean(problem)} className="h-11">
              Create order
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
