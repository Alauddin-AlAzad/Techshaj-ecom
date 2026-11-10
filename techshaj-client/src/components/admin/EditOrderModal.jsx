import { Minus, Plus, Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useEditOrder } from '../../hooks/useAdminOrders.js'
import { formatPrice } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import Button from './Button.jsx'
import FormField from './FormField.jsx'
import Modal from './Modal.jsx'
import { inputClass } from './inputClass.js'
import { variantText } from './orderMeta.js'

const toNumber = (value) => (value === '' ? NaN : Number(value))

export default function EditOrderModal({ order, open, onClose }) {
  const edit = useEditOrder()
  const [customer, setCustomer] = useState({ name: order.customer?.name ?? '', phone: order.customer?.phone ?? order.phone ?? '', address: order.customer?.address ?? '', note: order.customer?.note ?? '' })
  const [items, setItems] = useState(order.items.map((item) => ({ price: String(item.price), quantity: item.quantity })))
  const [shipping, setShipping] = useState(String(order.shipping ?? 0))
  const [discount, setDiscount] = useState(String(order.discount ?? 0))

  const setItem = (i, next) => setItems((list) => list.map((item, j) => (j === i ? { ...item, ...next } : item)))
  const subtotal = items.reduce((sum, item) => sum + (toNumber(item.price) || 0) * item.quantity, 0)
  const total = subtotal + (toNumber(shipping) || 0) - (toNumber(discount) || 0)

  const problem = (() => {
    if (!customer.name.trim()) return 'Name is required'
    if (!/^01[3-9]\d{8}$/.test(customer.phone.trim())) return 'Phone must be 11 digits, like 01XXXXXXXXX'
    if (!customer.address.trim()) return 'Address is required'
    if (items.some((item) => !Number.isInteger(toNumber(item.price)) || toNumber(item.price) < 0)) return 'Prices must be whole numbers'
    if (!items.some((item) => item.quantity > 0)) return 'Keep at least one item, or cancel the order instead'
    for (const [value, label] of [[shipping, 'Delivery charge'], [discount, 'Discount']]) {
      if (!Number.isInteger(toNumber(value)) || toNumber(value) < 0) return `${label} must be a whole number`
    }
    if (total < 0) return 'Discount cannot be more than the order amount'
    return null
  })()

  const save = () =>
    edit.mutate(
      {
        orderId: order.orderId,
        customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(), note: customer.note.trim() },
        items: items.map((item) => ({ price: toNumber(item.price), quantity: item.quantity })),
        shipping: toNumber(shipping),
        discount: toNumber(discount),
      },
      {
        onSuccess: () => {
          notify.success('Order updated', { description: `#${order.orderId}` })
          onClose()
        },
        onError: (error) => notify.error('Could not save the order', { description: errorMessage(error) }),
      },
    )

  const field = (key, label, props = {}) => (
    <FormField label={label} htmlFor={`edit-${key}`}>
      <input id={`edit-${key}`} value={customer[key]} onChange={(e) => setCustomer((c) => ({ ...c, [key]: e.target.value }))} className={inputClass()} {...props} />
    </FormField>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit order #${order.orderId}`}
      size="lg"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-body text-text-muted">
            New total <b className="text-text">{formatPrice(Math.max(total, 0))}</b>
            {total !== order.total && <span className="ml-1.5 text-body-sm">(was {formatPrice(order.total)})</span>}
          </span>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={onClose} className="h-11 flex-1 sm:h-10">
              Cancel
            </Button>
            <Button onClick={save} loading={edit.isPending} disabled={Boolean(problem)} className="h-11 flex-1 sm:h-10">
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h3 className="text-label text-text">Items</h3>
          <ul className="flex flex-col divide-y divide-row-line rounded-xl border border-border">
            {order.items.map((item, i) => {
              const row = items[i]
              const removed = row.quantity === 0
              return (
                <li key={i} className={cn('flex flex-col gap-3 p-3 sm:flex-row sm:items-center', removed && 'bg-fill-soft')}>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cn('line-clamp-2 text-body font-semibold text-text', removed && 'text-text-faint line-through')}>{item.name}</span>
                    {variantText(item.variant) && <span className="text-body-sm text-text-muted">{variantText(item.variant)}</span>}
                  </div>
                  {removed ? (
                    <Button variant="ghost" Icon={Undo2} onClick={() => setItem(i, { quantity: order.items[i].quantity })} className="self-start sm:self-auto">
                      Undo remove
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-1.5 text-body-sm text-text-muted">
                        ৳
                        <input
                          aria-label={`Price of ${item.name}`}
                          inputMode="numeric"
                          value={row.price}
                          onChange={(e) => setItem(i, { price: e.target.value.replace(/\D/g, '') })}
                          className={cn(inputClass(), 'h-10 w-24 text-right')}
                        />
                      </label>
                      <div className="flex h-10 items-center rounded-lg border border-border-strong">
                        <button type="button" aria-label="Decrease quantity" onClick={() => setItem(i, { quantity: Math.max(row.quantity - 1, 1) })} className="flex size-10 items-center justify-center text-text-muted hover:text-text">
                          <Minus size={15} />
                        </button>
                        <span className="w-7 text-center text-body font-semibold text-text">{row.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => setItem(i, { quantity: Math.min(row.quantity + 1, 99) })} className="flex size-10 items-center justify-center text-text-muted hover:text-text">
                          <Plus size={15} />
                        </button>
                      </div>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setItem(i, { quantity: 0 })} className="flex size-10 items-center justify-center rounded-lg text-text-muted hover:bg-error-tint hover:text-error">
                        <Trash2 size={16} />
                      </button>
                      <span className="w-20 text-right text-body font-bold text-text max-sm:ml-auto">{formatPrice((toNumber(row.price) || 0) * row.quantity)}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="text-body-sm text-text-muted">Changing a quantity or removing an item updates the product stock.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <FormField label="Delivery charge" htmlFor="edit-shipping">
            <input id="edit-shipping" inputMode="numeric" value={shipping} onChange={(e) => setShipping(e.target.value.replace(/\D/g, ''))} className={inputClass()} />
          </FormField>
          <FormField label="Discount" htmlFor="edit-discount">
            <input id="edit-discount" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))} className={inputClass()} />
          </FormField>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-label text-text">Customer</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'Name', { maxLength: 80 })}
            {field('phone', 'Phone', { inputMode: 'numeric', maxLength: 11 })}
          </div>
          <FormField label="Address" htmlFor="edit-address">
            <textarea id="edit-address" rows={2} value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} maxLength={300} className={cn(inputClass(), 'h-auto resize-none py-3')} />
          </FormField>
          {field('note', 'Customer note', { maxLength: 300 })}
        </section>

        {problem && (
          <p role="alert" className="rounded-lg bg-error-tint px-3 py-2.5 text-body-sm font-medium text-error">
            {problem}
          </p>
        )}
      </div>
    </Modal>
  )
}
