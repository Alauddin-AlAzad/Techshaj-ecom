// Same steps as the orders in fakeData.
const STEPS = [
  { key: 'order-placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out-for-delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
]

// TS + yymmdd + a digit, e.g. TS2610306. Grows a digit if the day's ids run out.
export function newOrderId(existingIds, date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const prefix = `TS${pad(date.getFullYear() % 100)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  for (let digits = 1; ; digits++) {
    const free = Array.from({ length: 10 ** digits }, (_, i) => `${prefix}${String(i).padStart(digits, '0')}`).filter((id) => !existingIds.includes(id))
    if (free.length) return free[Math.floor(Math.random() * free.length)]
  }
}

export function buildOrder({ id, form, lines, zone, subtotal, shipping, discount, coupon }) {
  const placedAt = new Date().toISOString()
  return {
    id,
    phone: form.phone,
    name: form.name.trim(),
    address: form.address.trim(),
    note: form.note?.trim() ?? '',
    status: 'placed',
    placedAt,
    shippingZoneId: zone.id,
    paymentMethod: form.payment,
    transactionId: form.payment === 'cod' ? null : form.trxId.trim(),
    items: lines.map((l) => ({
      productId: l.product.id,
      slug: l.product.slug,
      name: l.product.name,
      image: l.product.images[0],
      price: l.product.price,
      qty: l.qty,
      variant: l.variant,
    })),
    subtotal,
    shipping,
    discount,
    coupon: coupon?.code ?? null,
    total: subtotal + shipping - discount,
    steps: STEPS.map((s, i) => ({ ...s, done: i === 0, date: i === 0 ? placedAt : null })),
    courier: null,
  }
}

export const itemCount = (order) => order.items.reduce((sum, i) => sum + i.qty, 0)

export const PAYMENT_LABELS = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad' }

export const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Latest possible delivery date from the zone's "2-4 days".
export function expectedDelivery(order, zones) {
  const days = zones.find((z) => z.id === order.shippingZoneId)?.days ?? ''
  const max = Number(days.match(/(\d+)\s*days/)?.[1] ?? 4)
  const date = new Date(order.placedAt)
  date.setDate(date.getDate() + max)
  return date
}
