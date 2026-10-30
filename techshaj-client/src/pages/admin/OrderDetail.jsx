import { Ban, Check, ChevronLeft, CircleCheck, Clock, Copy, ImageOff, MapPin, PackageCheck, Phone, Printer, SearchX, Truck } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { Link, useParams } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { NEXT_STATUS, PAYMENT_LABELS, STATUS_LABELS, canCancel, itemCount, variantText, whatsappNumber } from '../../components/admin/orderMeta.js'
import { useAdminOrder, useUpdateCourier, useUpdateOrderStatus } from '../../hooks/useAdminOrders.js'
import { formatDate, formatPrice } from '../../lib/adminFormat.js'
import { copyText } from '../../lib/clipboard.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage, isNotFound } from '../../lib/query.js'

const COURIERS = ['Steadfast', 'Pathao', 'RedX', 'Sundarban', 'eCourier']

const NEXT_ACTION = {
  confirmed: { label: 'Confirm order', Icon: CircleCheck, done: 'Order confirmed' },
  shipped: { label: 'Mark as shipped', Icon: Truck, done: 'Order marked as shipped' },
  delivered: { label: 'Mark as delivered', Icon: PackageCheck, done: 'Order marked as delivered' },
}

const TIMELINE_ICONS = { pending: Clock, confirmed: CircleCheck, shipped: Truck, delivered: PackageCheck, cancelled: Ban }
const TIMELINE_TONES = {
  pending: 'bg-highlight-soft text-highlight-ink',
  confirmed: 'bg-secondary-tint text-violet',
  shipped: 'bg-info-tint text-info',
  delivered: 'bg-success-tint text-success',
  cancelled: 'bg-error-tint text-error',
}

function Card({ title, children, className }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:p-5', className)}>
      {title && <h2 className="text-h4 text-text">{title}</h2>}
      {children}
    </section>
  )
}

function Thumb({ src }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill text-text-faint">
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" /> : <ImageOff size={18} />}
    </span>
  )
}

function Line({ label, value, strong, tone }) {
  return (
    <div className={cn('flex justify-between gap-4 text-body', strong ? 'font-bold text-text' : 'text-text-muted')}>
      <span>{label}</span>
      <span className={cn('whitespace-nowrap', !strong && 'font-semibold text-text', tone)}>{value}</span>
    </div>
  )
}

// Only the order id, customer, address, phone, items, total and payment, on one page.
function PrintSlip({ order }) {
  return (
    <div className="hidden text-[12px] text-dark print:block">
      <div className="flex items-start justify-between border-b border-dark pb-2">
        <div>
          <p className="text-[18px] font-bold">TechShaj</p>
          <p>Order #{order.orderId}</p>
        </div>
        <p>{formatDate(order.createdAt, { withTime: true })}</p>
      </div>
      <div className="flex flex-col gap-0.5 border-b border-dark py-2">
        <p className="text-[14px] font-bold">{order.customer?.name}</p>
        <p>Phone: {order.customer?.phone ?? order.phone}</p>
        <p>Address: {order.customer?.address}</p>
        {order.area && <p>Area: {order.area}</p>}
      </div>
      <table className="my-2 w-full border-collapse">
        <thead>
          <tr className="border-b border-dark text-left">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-b border-border-strong align-top">
              <td className="py-1 pr-2">
                {item.name}
                {variantText(item.variant) && <span className="block text-[11px]">{variantText(item.variant)}</span>}
              </td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">{formatPrice(item.lineTotal ?? item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between text-[15px] font-bold">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </div>
      <p className="mt-1">
        Payment: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
        {order.paymentMethod === 'cod' ? ` (collect ${formatPrice(order.total)})` : order.transactionId ? `, paid, TrxID ${order.transactionId}` : ''}
      </p>
    </div>
  )
}

function CourierForm({ order }) {
  const update = useUpdateCourier()
  const [courier, setCourier] = useState(order.courier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '')
  const changed = courier.trim() !== (order.courier ?? '') || trackingNumber.trim() !== (order.trackingNumber ?? '')
  const disabled = order.status === 'cancelled'

  const save = (e) => {
    e.preventDefault()
    update.mutate(
      { orderId: order.orderId, courier: courier.trim(), trackingNumber: trackingNumber.trim() },
      {
        onSuccess: () => notify.success('Courier details saved'),
        onError: (error) => notify.error('Could not save courier', { description: errorMessage(error) }),
      },
    )
  }

  return (
    <Card title="Courier">
      <form onSubmit={save} className="flex flex-col gap-3">
        <FormField label="Courier service" htmlFor="courier">
          <input id="courier" list="courier-list" value={courier} onChange={(e) => setCourier(e.target.value)} disabled={disabled} placeholder="e.g. Steadfast" maxLength={100} className={inputClass()} />
          <datalist id="courier-list">
            {COURIERS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FormField>
        <FormField label="Tracking number" htmlFor="tracking">
          <input id="tracking" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} disabled={disabled} placeholder="From the courier's booking" maxLength={100} className={inputClass()} />
        </FormField>
        {disabled ? (
          <p className="text-body-sm text-text-muted">A cancelled order cannot get courier details.</p>
        ) : (
          <Button type="submit" Icon={Truck} loading={update.isPending} disabled={!changed} className="w-full bg-text hover:bg-dark">
            Save courier
          </Button>
        )}
      </form>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-5">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[220px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/admin/orders" className="flex w-fit items-center gap-1 text-[13px] font-medium text-text-muted hover:text-text print:hidden">
      <ChevronLeft size={16} />
      Orders
    </Link>
  )
}

// Figma "Admin – Order Details" (56:8370) and "Order Details – Mobile" (64:10679).
export default function OrderDetail() {
  const { orderId } = useParams()
  const { data: order, isLoading, isError, error, refetch } = useAdminOrder(orderId)
  const updateStatus = useUpdateOrderStatus()
  const [note, setNote] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (isLoading) return <DetailSkeleton />
  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <div className="rounded-xl border border-border bg-white">
          {isNotFound(error) ? (
            <EmptyState Icon={SearchX} title="Order not found" text={`There is no order #${orderId}.`} action={{ label: 'Back to orders', to: '/admin/orders' }} />
          ) : (
            <ErrorState onRetry={refetch} />
          )}
        </div>
      </div>
    )
  }

  const next = NEXT_STATUS[order.status]
  const nextAction = next && NEXT_ACTION[next]
  const cancellable = canCancel(order.status)
  const phone = order.customer?.phone ?? order.phone
  const history = order.statusHistory?.length ? order.statusHistory : [{ status: order.status, at: order.createdAt }]
  const count = itemCount(order)

  const changeStatus = (status) =>
    updateStatus.mutate(
      { orderId: order.orderId, status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          notify.success(status === 'cancelled' ? 'Order cancelled' : NEXT_ACTION[status].done, { description: `#${order.orderId}` })
          setNote('')
          setConfirmCancel(false)
        },
        onError: (err) => {
          notify.error('Could not update the order', { description: errorMessage(err) })
          setConfirmCancel(false)
        },
      },
    )

  return (
    <>
      <PrintSlip order={order} />
      <div className={cn('flex flex-col gap-5 print:hidden', nextAction && 'max-lg:pb-20')}>
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold text-text">#{order.orderId}</h1>
              <StatusBadge status={order.status} />
              <span className="rounded-md bg-fill px-2 py-[3px] text-label-sm text-text-secondary">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            </div>
            <p className="text-[13px] text-text-muted">Placed on {formatDate(order.createdAt, { withTime: true })}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary" Icon={Printer} onClick={() => window.print()}>
              Print slip
            </Button>
            {cancellable && (
              <Button variant="secondary" Icon={Ban} onClick={() => setConfirmCancel(true)} disabled={updateStatus.isPending} className="hover:border-error hover:text-error max-lg:hidden">
                Cancel order
              </Button>
            )}
            {nextAction && (
              <Button Icon={nextAction.Icon} onClick={() => changeStatus(next)} loading={updateStatus.isPending && updateStatus.variables?.status === next} disabled={updateStatus.isPending} className="max-lg:hidden">
                {nextAction.label}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <Card title={`Items (${count})`}>
              <ul className="flex flex-col divide-y divide-row-line">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 first:pt-0">
                    <Thumb src={item.image} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      {item.slug ? (
                        <a href={`/product/${item.slug}`} target="_blank" rel="noreferrer" className="line-clamp-2 text-body font-semibold text-text hover:text-primary">
                          {item.name}
                        </a>
                      ) : (
                        <span className="line-clamp-2 text-body font-semibold text-text">{item.name}</span>
                      )}
                      {variantText(item.variant) && <span className="text-body-sm text-text-muted">{variantText(item.variant)}</span>}
                      <span className="text-body-sm text-text-muted sm:hidden">
                        {formatPrice(item.price)} × {item.quantity}
                      </span>
                    </div>
                    <span className="text-[13px] whitespace-nowrap text-text-muted max-sm:hidden">
                      {formatPrice(item.price)} × {item.quantity}
                    </span>
                    <span className="w-20 text-right text-body font-bold whitespace-nowrap text-text">{formatPrice(item.lineTotal ?? item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2.5 border-t border-border pt-4">
                <Line label="Subtotal" value={formatPrice(order.subtotal)} />
                <Line label={`Delivery${order.area ? ` (${order.area})` : ''}`} value={order.shipping ? formatPrice(order.shipping) : 'Free'} />
                {order.discount > 0 && <Line label={`Discount${order.coupon ? ` (${order.coupon})` : ''}`} value={`−${formatPrice(order.discount)}`} tone="text-success" />}
                <Line label="Total" value={formatPrice(order.total)} strong />
                <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-fill-soft p-3 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-text-muted">Payment method</span>
                    <span className="font-semibold text-text">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                  </div>
                  {order.paymentMethod === 'cod' ? (
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted">Amount to collect</span>
                      <span className="font-bold text-text">{formatPrice(order.total)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted">Transaction ID</span>
                      <span className="font-semibold break-all text-text">{order.transactionId ?? '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Order timeline">
              <ol className="flex flex-col">
                {history.map((entry, i) => {
                  const Icon = TIMELINE_ICONS[entry.status] ?? Clock
                  return (
                    <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                      {i < history.length - 1 && <span aria-hidden="true" className="absolute top-9 bottom-1 left-[15px] w-px bg-border-strong" />}
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', TIMELINE_TONES[entry.status] ?? 'bg-fill text-text-muted')}>
                        <Icon size={16} />
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                        <span className="text-[13px] font-semibold text-text">{i === 0 && entry.status === 'pending' ? 'Order placed by customer' : (STATUS_LABELS[entry.status] ?? entry.status)}</span>
                        <span className="text-body-sm text-text-muted">
                          {formatDate(entry.at, { withTime: true })}
                          {entry.by && ` · ${entry.by}`}
                        </span>
                        {entry.note && <span className="text-body-sm text-text-secondary">“{entry.note}”</span>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Card title="Customer">
              <div className="flex flex-col gap-2">
                <p className="text-body-lg font-bold text-text">{order.customer?.name}</p>
                <div className="flex items-center gap-2 text-body text-text-secondary">
                  <Phone size={15} className="shrink-0 text-text-muted" />
                  <a href={`tel:${phone}`} className="hover:text-primary">
                    {phone}
                  </a>
                  <button type="button" onClick={() => copyText(phone, 'Phone number copied')} aria-label="Copy phone number" className="text-text-faint hover:text-text">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex items-start gap-2 text-body text-text-secondary">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-text-muted" />
                  <span>
                    {order.customer?.address}
                    {order.area && <span className="text-text-muted"> · {order.area}</span>}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <a href={`tel:${phone}`} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-text text-[13px] font-semibold text-white hover:bg-dark">
                  <Phone size={16} />
                  Call
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(`Hello ${order.customer?.name ?? ''}, about your TechShaj order #${order.orderId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-whatsapp-ink text-[13px] font-semibold text-white hover:opacity-90"
                >
                  <FaWhatsapp size={17} />
                  WhatsApp
                </a>
              </div>
              {order.customer?.note && (
                <div className="flex flex-col gap-1 rounded-lg bg-highlight-tint p-3">
                  <span className="text-label-sm text-highlight-ink">Customer note</span>
                  <p className="text-[13px] whitespace-pre-line text-text">{order.customer.note}</p>
                </div>
              )}
            </Card>

            {(nextAction || cancellable) && (
              <Card title="Update status">
                <FormField label="Note (optional)" htmlFor="status-note" hint="Saved in the order timeline.">
                  <textarea id="status-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Confirmed on phone" className={cn(inputClass(), 'h-auto resize-none py-3')} />
                </FormField>
                <div className="flex flex-col gap-2">
                  {nextAction && (
                    <Button Icon={nextAction.Icon} onClick={() => changeStatus(next)} loading={updateStatus.isPending && updateStatus.variables?.status === next} disabled={updateStatus.isPending} className="h-11 w-full">
                      {nextAction.label}
                    </Button>
                  )}
                  {cancellable && (
                    <Button variant="secondary" Icon={Ban} onClick={() => setConfirmCancel(true)} disabled={updateStatus.isPending} className="h-11 w-full text-error hover:border-error">
                      Cancel order
                    </Button>
                  )}
                </div>
              </Card>
            )}
            {order.status === 'delivered' && (
              <p className="flex items-center gap-2 rounded-xl border border-border bg-white p-4 text-[13px] font-semibold text-success">
                <Check size={16} />
                This order is complete.
              </p>
            )}

            <CourierForm key={`${order.courier}-${order.trackingNumber}`} order={order} />
          </div>
        </div>

        {nextAction && (
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-border bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden">
            <button type="button" onClick={() => window.print()} aria-label="Print slip" className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border-strong text-text">
              <Printer size={20} />
            </button>
            <Button Icon={nextAction.Icon} onClick={() => changeStatus(next)} loading={updateStatus.isPending && updateStatus.variables?.status === next} disabled={updateStatus.isPending} className="h-12 flex-1 rounded-xl text-[15px]">
              {nextAction.label}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => changeStatus('cancelled')}
        loading={updateStatus.isPending}
        danger
        title={`Cancel order #${order.orderId}?`}
        message="The stock for every item in this order will be added back. This cannot be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
      />
    </>
  )
}
